/**
 * Created by jannevainio on 18/03/2023. 938 lines
 */

const SVGNS = 'http://www.w3.org/2000/svg';
const RADANGLEMULT = Math.PI/180;
const BORDERSCALE = 1/100*0.75;
let gaugeList = [];

// pSBC - Shade Blend Convert - Version 4.1 - 01/7/2021, https://github.com/PimpTrizkit/PJs/blob/master/pSBC.js

const pSBC=(p,c0,c1,l)=>{
  let r,g,b,P,f,t,h,m=Math.round,a=typeof(c1)=="string";
  if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
  h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=pSBC.pSBCr(c0),P=p<0,t=c1&&c1!="c"?pSBC.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
  if(!f||!t)return null;
  if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
  else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
  a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
  if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
  else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

pSBC.pSBCr=(d)=>{
  const i=parseInt;
  let n=d.length,x={};
  if(n>9){
    const [r, g, b, a] = (d = d.split(','));
    n = d.length;
    if(n<3||n>4)return null;
    x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
  }else{
    if(n==8||n==6||n<4)return null;
    if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
    d=i(d.slice(1),16);
    if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=Math.round((d&255)/0.255)/1000;
    else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
  }return x
}

function polarToCartesian(centerX, centerY, radiusx, radiusy, angleInDegrees) {
  var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + (radiusx * Math.cos(angleInRadians)),
    y: centerY + (radiusy * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radiusx, radiusy, startAngle, endAngle) {

  var start = polarToCartesian(x, y, radiusx, radiusy, endAngle);
  var end = polarToCartesian(x, y, radiusx, radiusy, startAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  var d = [
    "M", start.x, start.y,
    "A", radiusx, radiusy, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");

  return d;
}

function setGaugeColor(value, range, rangeColors) {

  let ind = 0;
  for (let i = 1; i < range.length; i++) {
    if (value >= range[i - 1] && value < range[i]) {
      ind = i;
    }
  }
  if (value >= range[range.length - 1]) {
    ind = range.length;
  }
  return rangeColors[ind];
}

function addSvgElement(el, width, height, bgColor, options) {

  const viewPortSize = width;
  const svgEl = document.createElementNS(SVGNS, "svg");
  svgEl.setAttribute('style', 'background-color: ' + bgColor + ';');
  svgEl.setAttribute('width', width);
  svgEl.setAttribute('height', height);
  svgEl.setAttribute('id', "svgroot");
  svgEl.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  svgEl.setAttribute("viewBox", "0 0 " + viewPortSize + " " + (viewPortSize * (height / width)));
  el.appendChild(svgEl);

  const defsEl = document.createElementNS(SVGNS, "defs");
  svgEl.appendChild(defsEl);

  const grad1El = document.createElementNS(SVGNS, "radialGradient");
  grad1El.setAttribute('id', "needleCenterGradient");
  defsEl.appendChild(grad1El);

  const styleEl = document.createElementNS(SVGNS, "style");
  styleEl.setAttribute('type', "text/css");
  styleEl.innerHTML = "@import url('https://fonts.googleapis.com/css2?family=Alkatra:wght@600&display=swap')";
  defsEl.appendChild(styleEl);

  const stop1El = document.createElementNS(SVGNS, "stop");
  stop1El.setAttribute('offset', "0%");
  stop1El.setAttribute('stop-color', "#b87f0d");

  const stop2El = document.createElementNS(SVGNS, "stop");
  stop2El.setAttribute('offset', "100%");
  stop2El.setAttribute('stop-color', "#bd6700");

  grad1El.appendChild(stop1El);
  grad1El.appendChild(stop2El);

  /*
  <radialGradient id="RadialGradient1">
    <stop offset="0%" stop-color="red" />
    <stop offset="100%" stop-color="blue" />
    </radialGradient>
    <radialGradient id="RadialGradient2" cx="0.25" cy="0.25" r="0.25">
    <stop offset="0%" stop-color="red" />
    <stop offset="100%" stop-color="blue" />
    </radialGradient>
     */
  return svgEl;
}

function js_valueToAngle(value, settings, off=0){
  return (value + off - settings.min) / (settings.max - settings.min) * settings.totalAngle - settings.totalAngle * 0.5;
}
function js_valueToAngle90(value, settings, off=0){
  return (value + off - settings.min) / (settings.max - settings.min) * settings.totalAngle - settings.totalAngle * 0.5 + 90;
}

function addNeedleBaseArc(el, settings){

  const needBaseEL = document.createElementNS(SVGNS, 'path');
  needBaseEL.style.stroke = "#dddddd";
  needBaseEL.style.strokeWidth = settings.thickLineWidth;
  needBaseEL.style.fill = "none";

  const needBaseEL2 = document.createElementNS(SVGNS, 'path');
  needBaseEL2.style.stroke = "#666666";
  needBaseEL2.style.strokeWidth = settings.thinLineWidth;
  needBaseEL2.style.fill = "none";

  const radiusOffset = settings.gaugeThickness + settings.labelWidth;
  const radiusX = (settings.width * 0.5 - radiusOffset);
  const radiusY = (settings.height * 0.5 - radiusOffset);
  const startAngle = js_valueToAngle(settings.min, settings);
  const endAngle = js_valueToAngle(settings.max, settings);

  needBaseEL.setAttribute("d", describeArc(settings.cx, settings.cy, radiusX, radiusY, startAngle, endAngle));
  needBaseEL2.setAttribute("d", describeArc(settings.cx, settings.cy, radiusX, radiusY, startAngle, endAngle));

  el.appendChild(needBaseEL);
  el.appendChild(needBaseEL2);
}

function addBaseArc(el, settings, cx, cy, color="#ffffff"){

  const arcEl = addArc(el, cx, cy,
    settings.radiusX,
    settings.radiusY,
    js_valueToAngle(settings.min, settings),
    js_valueToAngle(settings.max, settings),
    settings.gaugeThickness,
    color);
  const nameOffset = arcEl.getBBox();

  return nameOffset;
}

function addDivWrapper(el, className, htmlContent) {

  const wrapper = document.createElement("div");

  wrapper.classList.add(className);
  wrapper.innerHTML = htmlContent;
  el.appendChild(wrapper);

  return wrapper;
}

function setElementSize(el, width, height, borderSize=0){

  const realHeight = height > 0 ? height + 'px' :  "auto";
  el.setAttribute('style', (el.getAttribute('style')|| "") + 'width: ' + (width + 2 * borderSize) + 'px; height: ' +
    realHeight + ';');
}

function setRadiusSize(el, width, height, borderSize=0, flatbottom){

  el.setAttribute('style', (el.getAttribute('style')|| "") + 'border-top-left-radius: ' + ('100% ' ) + (height/width*100*0+100) + '% ;' +
    'border-top-right-radius: ' + ('100% ' ) + (height/width*100*0+100) + '% ;' +
    'border-bottom-left-radius: '+(flatbottom ? '0 ' : '100% ' ) + (height/width*100*0+100) + '% ;' +
    'border-bottom-right-radius: '+(flatbottom ? '0 ' : '100% ' ) + (height/width*100*0+100) + '% ;'

  );
}

function setELementFontSize(el, fontSize){
  el.setAttribute('style', (el.getAttribute('style')|| "") + 'font-size: ' + (fontSize) + 'px;');
}

function hideIfEmpty(el, text){
  if(!text){
    el.setAttribute('style', (el.getAttribute('style')|| "") + 'display: ' + 'none;');
  }
}
function createDerivedSettings(settings, el){

  settings.width = settings.size;
  settings.height = settings.size * settings.aspectRatio;

  if(settings.flatbottom){
    settings.type = "1/2";
    settings.compact = true;
  }

  const typeVals = settings.type.split("/");
  const typeScale = typeVals[0] / typeVals[1];
  settings.typeScale = typeScale;
  settings.totalAngle = 360 * typeScale - 0.00001;
  settings.borderScale = settings.size * BORDERSCALE;
  settings.margin = settings.margin ? settings.margin : settings.size / 20;
  const fontAdjust = settings.totalAngle <= 180 && settings.compact ? 0.8 : 1;
  settings.fontSize = Math.min(settings.height,settings.width) * 0.16 * fontAdjust;
  settings.fontSizeMedium = settings.fontSize * 0.80;
  settings.fontSizeSmall = settings.fontSize * 0.60;
  settings.fontSizeLabel = settings.fontSize * 0.50;

  settings.highLightActiveRange = settings.rangeColors && settings.rangeValues ? settings.highLightActiveRange : false;
  settings.nameFontSize = settings.nameFontSize ? settings.nameFontSize : settings.fontSizeMedium;
  settings.topHeight = settings.fontSize * 1.2;
  settings.bottomHeight = settings.fontSize * 1.2;
  settings.paddingBarWidth = settings.size * 0.08;
  settings.gaugeThickness = settings.size * 0.1;
  settings.rangeBarWidth = settings.size * 0.1;
  settings.smallMargin = settings.size * 0.05;
  settings.smallMargin = settings.size * 0.05;
  settings.verySmallMargin = Math.ceil(settings.fontSize * 0.50);
  settings.veryverySmallMargin = Math.ceil(settings.fontSize * 0.30);
  settings.thinLineWidth = settings.size * 0.005;
  settings.thickLineWidth = settings.thinLineWidth * 4;
  settings.valueBarWidth = settings.rangeBarWidth * 0.25;
  settings.padddingValueWidth = settings.valueBarWidth;

  for(let i=0; i < settings.theme.gaugeBorders.length; i++){
    settings.theme.gaugeBorders[i].width = minBorder(settings.theme.gaugeBorders[i].width*settings.borderScale);
  }
  settings.labelWidth = 0;
  settings.labelPrecision = 0;
  if(settings.majorLabels ||settings.minorLabels){
    settings.theme.gaugeBorders.pop();
    settings.labelPrecision = settings.max > 1 ? 0 : settings.precision;
    const text = document.createElement("span");
    document.body.appendChild(text);
    text.style.fontFamily = "Alkatra, normal";
    text.style.fontSize = settings.fontSizeSmall + "px";
    text.style.height = 'auto';
    text.style.width = 'auto';
    text.style.position = 'absolute';
    text.style.whiteSpace = 'no-wrap';
    text.innerHTML = settings.tickLabelWidthInChars ?
      "88888888888888".substr(0, settings.tickLabelWidthInChars):
      settings.max.toFixed(settings.labelPrecision);

    const labelWidth = Math.ceil(text.clientWidth);
    //settings.labelWidth = labelWidth + settings.verySmallMargin;
    settings.labelWidth = labelWidth + settings.verySmallMargin;
    document.body.removeChild(text);
    // TODO settings.theme.gaugeBorders[settings.theme.gaugeBorders.length-1].width = labelWidth;
  }
  settings.cx = settings.width * 0.5;
  settings.cy = settings.height * 0.5;
  settings.radiusX = settings.width * 0.5 - settings.gaugeThickness*0.5;
  settings.radiusY = settings.height * 0.5 - settings.gaugeThickness*0.5;
  settings.needle = {};
  settings.needle.centerRadius = settings.width/20;
  settings.outerSize = settings.theme.gaugeBorders.reduce((total, item)=>total+(item.width)*2, settings.size);

  switch(settings.namePosition){
    case "top" :
      settings.title = settings.name;
      settings.name = settings.unit;
      settings.unit = "";


      break;
    case "bottom" :
      settings.title2 = settings.name;
      settings.name = settings.unit;
      settings.unit = "";
      break;
    default:

  }
}

const ellipticLength = (vr, hr, angle) => {

  const s = Math.sin(angle * RADANGLEMULT);
  const c = Math.cos(angle * RADANGLEMULT);

  return (vr*hr)/Math.sqrt(vr * vr *s * s + hr * hr * c * c);
}

function addLabel(el, cx, cy, fontSize, value, ratio, a, b, labelWidth, angle=0){

  let sx;

  if(ratio == 1){
    sx = cx-a + labelWidth;
  }
  else {
    const rx2 = ellipticLength(b,a, angle+90);
    sx = cx-rx2 + labelWidth;
  }
  let anchor = "end";
  let baseline = "middle";

  if(angle < -90){
    anchor = "start";
  }
  if(Math.round(angle) === -90){
    anchor = "middle";
    baseline = "auto";
  }
  JTextField (el, sx, cy, value, fontSize, anchor, baseline, "#666666", angle);
}

function addTick(el, cx, cy, angle, width, color, thickness=1, a, b, ratio=1, labelWidth) {
  const gEl = document.createElementNS(SVGNS, 'g');
  const lineEl = document.createElementNS(SVGNS, 'line');

  if(ratio == 1){

    lineEl.setAttributeNS(null, 'x1', cx-a + labelWidth);
    lineEl.setAttributeNS(null, 'y1', cy);
    lineEl.setAttributeNS(null, 'x2', cx-a+width + labelWidth);
    lineEl.setAttributeNS(null, 'y2', cy);
  }
  else {
    const rx2 = ellipticLength(b,a, angle+90);
    lineEl.setAttributeNS(null, 'x1', cx  -rx2 +  labelWidth);
    lineEl.setAttributeNS(null, 'y1', cy);
    lineEl.setAttributeNS(null, 'x2', cx - rx2+width +  labelWidth);
    lineEl.setAttributeNS(null, 'y2', cy);
  }
  lineEl.style.strokeWidth = thickness; //Set stroke width
  lineEl.style.stroke = color;
  lineEl.style.fill = "none";
  gEl.appendChild(lineEl);
  gEl.setAttribute("transform",`rotate(${angle} ${cx} ${cy})`);
  el.appendChild(gEl);

  return gEl;
}

function addArc(el, cx, cy, radiusx, radiusy, start, end, width, color) {
  const arcEl = document.createElementNS(SVGNS, 'path');

  arcEl.setAttribute("d", describeArc(cx, cy, radiusx, radiusy, start, end));
  arcEl.style.strokeWidth = width; //Set stroke width
  arcEl.style.stroke = color;
  arcEl.style.fill = "none";
  el.appendChild(arcEl);

  return arcEl;
}

function addRanges(el, cx, cy, settings){

  const rangeSvgEls = [];
  let prevRangeValue=settings.min;
  for(let i=0; i < settings.rangeColors.length;i++){
    const rangeValue = i < settings.rangeColors.length - 1 ? settings.rangeValues[i] : settings.max;

    rangeSvgEls.push(addArc(el, cx, cy,
      (settings.width - settings.gaugeThickness) * 0.5-settings.labelWidth,
      (settings.height - settings.gaugeThickness ) * 0.5-settings.labelWidth,
      js_valueToAngle(prevRangeValue, settings),
      js_valueToAngle(rangeValue, settings),
      settings.gaugeThickness,
      settings.rangeColors[i]));

    prevRangeValue = rangeValue;
  }
  return rangeSvgEls;
}
function addTicks(el, cx, cy, settings){

  const tickSvgEls = [];
  const labelSvgEls = [];

  let startValue=settings.min;
  let ticks=4;

  let valueStep = (settings.max-settings.min)/ticks;

  for(let i=0; i < settings.majorTicks;i++){

    const tickEl = addTick(el, cx, cy,
      js_valueToAngle90(startValue, settings),
      settings.gaugeThickness*0.75,
      settings.theme.tickColor, settings.gaugeThickness*0.1, settings.width*0.5, settings.height*0.5, settings.aspectRatio, settings.labelWidth);
    tickSvgEls.push(tickEl);


    if(settings.majorLabels){
      labelSvgEls.push(addLabel(tickEl, cx, cy, settings.fontSizeLabel,
        startValue.toFixed(settings.labelPrecision),settings.aspectRatio, settings.width*0.5, settings.height*0.5,
        settings.labelWidth-settings.verySmallMargin*0.5, -1*js_valueToAngle90(startValue, settings)));
    }

    if(i < settings.majorTicks - 1){
      let valueStep2 = valueStep * 1/(settings.minorTicks+1);
      let startValue2 =startValue + valueStep2;
      for(let j=0; j < settings.minorTicks;j++){

        const tickEl =addTick(el, cx, cy,
          js_valueToAngle90(startValue2, settings),
          settings.gaugeThickness*0.5,
          settings.theme.tickColor, settings.gaugeThickness*0.05, settings.width*0.5, settings.height*0.5,
          settings.aspectRatio, settings.labelWidth);

          tickSvgEls.push(tickEl);

        if(settings.minorLabels){
          labelSvgEls.push(addLabel(tickEl, cx, cy, settings.fontSizeLabel,
            startValue2.toFixed(settings.labelPrecision),settings.aspectRatio, settings.width*0.5,
            settings.height*0.5, settings.labelWidth-settings.verySmallMargin*0.5, -1*js_valueToAngle90(startValue2, settings)));

        }
        startValue2 += valueStep2;
      }
    }
    startValue += valueStep;
  }
  startValue=settings.min + valueStep * 1/(settings.minorTicks+1);
  valueStep = startValue;
}

function createSvgLayout(el, settings){

  const cx = settings.width * 0.5;
  const cy = settings.height * 0.5;

  const elWrapper = addDivWrapper(el, "svg-wrapper", "");
  setElementSize(elWrapper, settings.width, settings.height);

  const svgEl = addSvgElement(elWrapper, settings.width, settings.height,
    settings.theme.gaugebackgroundColor, settings);

  const arcHeight =  settings.height - settings.gaugeThickness;

  let joinValueAndUnit = (settings.flatbottom || (settings.totalAngle > 270 && !settings.compact)) && settings.namePosition === "inside";

  let valueYOffset = settings.flatbottom ? cy : arcHeight ;
  let valueBaseLine= "auto";
  let valueAlign = "middle";

  let unitYOffset = cy + settings.needle.centerRadius + (settings.compact ? -settings.verySmallMargin : settings.verySmallMargin);
  let unitBaseLine= settings.compact ? "hanging" : "hanging";
  let unitAlign = "middle";

  const nameBaseOffset = settings.gaugeThickness + settings.labelWidth;
  const nameYOffset =  nameBaseOffset + (cy - nameBaseOffset)*0.5;
  let nameBaseLine= settings.compact && settings.totalAngle > 180 ? "hanging" : "middle";

  if(settings.totalAngle > 270 ){
    valueYOffset = settings.height*0.75;
    valueBaseLine= "middle";
  }

  if(settings.totalAngle <= 180 && !settings.flatbottom){
    valueYOffset = settings.height*0.75;
    valueBaseLine = "hanging";
  }

  if(joinValueAndUnit){
    unitYOffset = valueYOffset;
    unitAlign = "start";
    valueAlign = "end";
  }


  const svgNameField = JTextField(svgEl, cx, nameYOffset, settings.name,
    settings.labelWidth ? settings.fontSizeSmall: settings.fontSizeMedium, "middle", nameBaseLine, settings.theme.nameColor);

  const svgUnitField = JTextField(svgEl, cx, unitYOffset,
    settings.unit, settings.fontSizeMedium, unitAlign,
    (joinValueAndUnit)  ? valueBaseLine : unitBaseLine, settings.theme.unitColor);

  const svgValueField = JTextField(svgEl, cx, valueYOffset,
    parseFloat(settings.max).toFixed(settings.precision),
    settings.fontSize, valueAlign,
    valueBaseLine, settings.theme.valueColor);

  if(joinValueAndUnit){

    const valueBox = svgValueField.getBoundingRect();
    const unitBox = svgUnitField.getBoundingRect();
    const valueWidth =  valueBox.width;
    const unitWidth =  unitBox.width;

    svgValueField.setPos(cx + (valueWidth-unitWidth)*0.5 - settings.verySmallMargin*0.5,
      valueYOffset);
    svgUnitField.setPos(cx + (valueWidth-unitWidth)*0.5 + settings.verySmallMargin*0.5,
      valueYOffset);
  }

  if(settings.compact){
    addNeedleBaseArc(svgEl, settings);
  }

  let rangeSvgEls;
  let tickSvgEls;

  if(settings.rangeValues && settings.rangeColors){
    rangeSvgEls = addRanges(svgEl, cx, cy, settings);
  }

  if(settings.majorTicks > 0){
    tickSvgEls = addTicks(svgEl, cx, cy, settings);
  }

  return {svgEl, svgValueField, svgUnitField, svgNameField, rangeSvgEls, tickSvgEls};
}

const minBorder = border => border < 1 ? 1 : Math.round(border);

function createLayout(el, settings){

  const rootEl = addDivWrapper(el, "jg-root", "");

  rootEl.setAttribute('style', (rootEl.getAttribute('style')|| "") + 'margin: ' + settings.margin + 'px;');

  const rootTopEl = addDivWrapper(rootEl, "jg-root-top", settings.title);

  // Just static borders

  let parentEl = rootEl;

  const theme = settings.theme;
  const borders = theme.gaugeBorders;

  const borderCount = borders.length;

  let tmpParent = parentEl;

  let flatFixedEl;
  if(settings.flatbottom){
    flatFixedEl = addDivWrapper(tmpParent, "jg-flat-fixed", "");
    const flatEl = addDivWrapper(flatFixedEl, "jg-flat", "");

    let adjustedHeight = settings.outerSize * settings.aspectRatio;
    const totalBorderWidth = settings.theme.gaugeBorders.reduce((tot, curr) => tot += curr.width ,0);
    adjustedHeight = adjustedHeight * 0.5 + totalBorderWidth +
      settings.verySmallMargin - theme.gaugeBorders[borderCount-1].width;

    setElementSize(flatFixedEl, settings.outerSize, adjustedHeight, 0);

    tmpParent = flatEl;
  }

  let widthIncrement = 0;
  for(let i = 0; i < borderCount; i++){
    const tmpEl = addDivWrapper(tmpParent, "jg-border-"+i, "");
    const red = Math.ceil(Math.random()*255);
    const green = Math.ceil(Math.random()*255);
    const blue = Math.ceil(Math.random()*255);
    let col = theme.gaugeBorders[i].color ?  theme.gaugeBorders[i].color : "#" + red.toString(16) + green.toString(16) + blue.toString(16);


    /*
     background: linear-gradient(white, white) padding-box,
     linear-gradient(to right bottom, darkblue, darkorchid) border-box;
     */
    if(theme.gaugeBorders[i].gradient && ! settings.flatbottom){
      col = "transparent"
    }
    tmpEl.setAttribute('style', (tmpEl.getAttribute('style')|| "") + 'border: ' +
      theme.gaugeBorders[i].width + 'px solid ' + col + ';'+
      'background: linear-gradient(' + theme.gaugebackgroundColor + ' ,' + theme.gaugebackgroundColor + ') padding-box, linear-gradient(to right, ' +
      theme.fromColor + ', ' + theme.toColor + ') border-box;'
    );
    setRadiusSize(tmpEl, settings.width, settings.height, 0, settings.flatbottom);

    tmpParent = tmpEl;

    if(settings.flatbottom && i < borderCount - 1) {

      // Add bottom border with bordercount divs with bottom border...
      const bottomEl = addDivWrapper(flatFixedEl, "jg-bottom-decorator", "  ");
      bottomEl.setAttribute('style', (bottomEl.getAttribute('style')|| "") +
        'border-top: ' + theme.gaugeBorders[i].width + 'px solid ' + theme.gaugeBorders[i].color + ';' +
        'border-left: ' + theme.gaugeBorders[i].width + 'px solid ' + theme.gaugeBorders[i].color + ';' +
        'border-right: ' + theme.gaugeBorders[i].width + 'px solid ' + theme.gaugeBorders[i].color + ';' +

        'position:absolute;left:' + (widthIncrement) +'px;bottom:'+ (widthIncrement) +'px;'+
        'width: ' + (settings.outerSize - widthIncrement*2) + 'px;');

        widthIncrement += theme.gaugeBorders[i].width;
    }
  }
  const rootGaugeEl = addDivWrapper(tmpParent, "jg-root-gauge", "");
  const rootBottomEl = addDivWrapper(rootEl, "jg-root-bottom", settings.title2);

  setRadiusSize(rootGaugeEl, settings.width, settings.height, 0, settings.flatbottom);
  setElementSize(rootTopEl, settings.outerSize, "auto", 0);
  setElementSize(rootBottomEl, settings.outerSize, "auto", 0);
  setELementFontSize(rootTopEl, settings.fontSizeMedium);
  setELementFontSize(rootBottomEl, settings.fontSizeMedium);
  hideIfEmpty(rootTopEl, settings.title);
  hideIfEmpty(rootBottomEl, settings.title2);

  return {rootEl, rootGaugeEl, rootTopEl, rootBottomEl};

}

const colorThemes = {
  "default":{
    baseColor: "#aaaaaa",
    gaugebackgroundColor: "#FDF9F1",
    unitColor: "#666666",
    valueColor: "#333333",
    nameColor: "#666666",
    tickColor: "#333333",
    get needleFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get needleBorderColor(){
      return pSBC(-0.9, this.baseColor);
    },
    get needleCenterFillColor(){
      return "#336688";
    },

    get gaugeBorders(){
      return [
        {width: 1, color: pSBC(-0.5, this.baseColor)},
        {width: 10, color: this.baseColor},
        {width: 0.5 , color: pSBC(0.6, this.baseColor)},
        {width: 2, color: pSBC(0.4, this.baseColor)},
        {width: 5, color: "#FDF9F1"}
      ]
    }

  },
  "custom":{
    baseColor: "#52af5d",
    gaugebackgroundColor: "#FDF9F1",
    get needleFillColor(){
      return pSBC(-0.2, this.baseColor);
    },
    get needleBorderColor(){
      pSBC(-0.6, this.baseColor);
    },
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, this.baseColor)},
        {width: 10, color: this.baseColor},
        {width: 1 , color: pSBC(0.6, this.baseColor)},
        {width: 3, color: pSBC(0.4, this.baseColor)},
        {width: 5, color: "#FDF9F1"}
      ]
    }
    /*
     background-color: #e2ac6b;
     background-image: linear-gradient(315deg, #e2ac6b 0%, #cba36d 74%);
     */
  },
  "bronze":{
    baseColor: "#cba36d",
    gradient: true,
    fromColor: "#cba36d",
    get valueColor(){
      return pSBC(-0.7, this.baseColor);
    },

    get toColor(){
      return pSBC(-0.5, this.fromColor);
    },
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#B30E16",
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    needleBorderColor: "#7D0A0F",
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, "#cba36d")},
        {width: 10, color: "#cba36d", gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 1 , color: pSBC(0.6, "#cba36d")},
        {width: 3, color: pSBC(0.4, "#cba36d"), gradient: true, fromColor: pSBC(0.3, "#cba36d"), toColor: pSBC(0.5, "#cba36d")},
        {width: 5, color: "#FDF9F1"}
      ]
    }
  },

  "minimal":{
    baseColor: "#cccccc",
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#B30E16",
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    needleBorderColor: "#7D0A0F",
    gaugeBorders: [
      {width: 1, color: "#666666"},
      {width: 1, color: "#FDF9F1"}
    ]
  },
  "minimal2":{
    baseColor: "#cccccc",
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#B30E16",
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    needleBorderColor: "#7D0A0F",
    gaugeBorders: [
      {width: 1, color: "#666666"},
      {width: 5, color: "#999999"},
      {width: 1, color: "#cccccc"},
      {width: 3, color: "#FDF9F1"}


    ]
  },


  "silver":{
    baseColor: "#cccccc",
    gradient: true,
    fromColor: "#cccccc",
    get valueColor(){
      return pSBC(-0.7, this.baseColor);
    },

    get toColor(){
      return pSBC(-0.3, this.fromColor);
    },
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#336688",
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    needleBorderColor: "#336688",
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, "#cccccc")},
        {width: 10, color: "#cccccc", gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 1 , color: pSBC(0.6, "#cccccc")},
        {width: 3, color: pSBC(0.4, "#cccccc")},
        {width: 5, color: "#FDF9F1"}
      ]
    }
  },

  "gold":{
    gradient: true,
    fromColor: "#D1B464",
    get toColor(){
      return pSBC(-0.5, this.fromColor);
    },
    baseColor: "#D1B464",
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#a95b0e",

    get nameColor(){
      return pSBC(-0.7, this.baseColor);
    },
    get unitColor(){
      return pSBC(-0.7, this.baseColor);
    },
    get valueColor(){
      return pSBC(-0.8, this.baseColor);
    },
    get tickColor(){
      return pSBC(-0.8, this.baseColor);
    },
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get needleBorderColor(){
      return pSBC(-0.5, "#a95b0e");
    },
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, this.baseColor)},
        {width: 10, color: this.baseColor, gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 1 , color: pSBC(0.6, this.baseColor)},
        {width: 3, color: pSBC(0.4, this.baseColor)},
        {width: 5, color: this.gaugebackgroundColor}

      ]
    }
  },
  "gold2":{
    gradient: true,
    fromColor: "#D1B464",
    get toColor(){
      return pSBC(-0.5, this.fromColor);
    },
    baseColor: "#D1B464",
    gaugebackgroundColor: "#FDF9F1",
    needleFillColor: "#a95b0e",

    get nameColor(){
      return pSBC(-0.7, this.baseColor);
    },
    get unitColor(){
      return pSBC(-0.7, this.baseColor);
    },
    get valueColor(){
      return pSBC(-0.8, this.baseColor);
    },
    get tickColor(){
      return pSBC(-0.8, this.baseColor);
    },
    get needleCenterFillColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get needleBorderColor(){
      return pSBC(-0.5, "#a95b0e");
    },
    get gaugeBorders(){
      return [
        {width: 1, color: pSBC(-0.5, this.baseColor)},
        {width: 3, color: this.baseColor, gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 1, color: pSBC(0.4, this.baseColor)},
        {width: 2, color: this.gaugebackgroundColor}

      ]
    }
  },
  "dark":{
    gradient: true,
    fromColor: "#D1B464",
    get toColor(){
      return pSBC(-0.5, this.fromColor);
    },
    get needleArcColor(){
      return pSBC(-0.5, this.fromColor);
    },
    baseColor: "#D1B464",
    gaugebackgroundColor: "#333333",
    needleFillColor: "#a95b0e",

    get nameColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get unitColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get valueColor(){
      return pSBC(-0.4, this.baseColor);
    },
    get tickColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get needleCenterFillColor(){
      return pSBC(-0.4, this.baseColor);
    },
    get needleBorderColor(){
      return pSBC(-0.4, "#a95b0e");
    },
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, this.baseColor)},
        {width: 6, color: this.baseColor, gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 2, color: pSBC(0.2, this.baseColor), gradient: true,
          fromColor: pSBC(0.2, this.baseColor), toColor: pSBC(0.1, this.baseColor)},
        {width: 3, color: this.gaugebackgroundColor}

      ]
    }
  },
  "semiDark":{
    gradient: true,
    fromColor: "#D1B464",
    get toColor(){
      return pSBC(-0.5, this.fromColor);
    },
    get needleArcColor(){
      return pSBC(-0.5, this.fromColor);
    },
    baseColor: "#D1B464",
    gaugebackgroundColor: "#ccdddd",
    needleFillColor: "#a95b0e",

    get nameColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get unitColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get valueColor(){
      return pSBC(-0.4, this.baseColor);
    },
    get tickColor(){
      return pSBC(-0.5, this.baseColor);
    },
    get needleCenterFillColor(){
      return pSBC(-0.4, this.baseColor);
    },
    get needleBorderColor(){
      return pSBC(-0.4, "#a95b0e");
    },
    get gaugeBorders(){
      return [
        {width: 2, color: pSBC(-0.5, this.baseColor)},
        {width: 6, color: this.baseColor, gradient: true, fromColor: this.fromColor, toColor: this.toColor},
        {width: 3, color: pSBC(0.2, this.baseColor), gradient: false,
          fromColor: pSBC(-0.8, this.baseColor), toColor: pSBC(0.3, this.baseColor)},
        {width: 3, color: this.gaugebackgroundColor}

      ]
    }
  }
}
const defaultSettings = {
  type: "3/4", size: 100, compact: false, aspectRatio: 1, precision: 1, min: 0, max: 100, theme: "default",

  unit: "&#176;C", flatbottom: false, layout: "normal", title: "",
  title2: "", name: "Gauge", shortName: "SN",
  majorTicks: 5, minorTicks: 2, tickLabelWidthInChars: 0,
  namePosition: "inside",
  highLightActiveRange: false
};

const setNeedlePath = (el, cx, cy, r, nw, centerRadius) =>
  el.setAttribute("d", `M ${cx+centerRadius*2} ${cy-nw} ${cx-r} ${cy} ${cx+centerRadius*2} ${cy+nw} Z`);

function jg_moveNeedle(el,  cx, cy, angle, a, b, nw, isCompact, centerRadius, settings){

  el.grpEl.setAttribute("transform",`rotate(${angle} ${cx} ${cy})`);

  const r = ellipticLength(a,b, angle );
  const compactOffset = isCompact ? r - settings.gaugeThickness - settings.labelWidth : 0;

  setNeedlePath(el.needleEl, cx-compactOffset, cy, r-compactOffset-settings.gaugeThickness*0.5, nw,
    isCompact ? 0 : centerRadius);
}

function js_addNeedle(el, cx, cy, theme, isCompact, centerRadius){

  const grpEl = document.createElementNS(SVGNS, 'g');
  const needleEl = document.createElementNS(SVGNS, 'path');

  needleEl.setAttribute("fill", theme.needleFillColor);
  needleEl.setAttribute("stroke", theme.needleBorderColor);

  //TODO const a = gaugeWidth * 0.5;
  //TODO const b = gaugeWidth * 0.5 * aspectRatio;

 //TODO const r = ellipticLength(a,b, angle );
  //TODO  const compactOffset = isFullCircle(layout) ? 0 : r*0.60;

  //TODO setNeedlePath(el.needleEl, cx-compactOffset, cy, r-compactOffset, nw,
  //TODO   isFullCircle(layout) ? centerRadius : 0);

  el.appendChild(grpEl);
  grpEl.appendChild(needleEl);

  if(!isCompact){
    const circleEl = document.createElementNS(SVGNS, 'circle');
    circleEl.setAttributeNS(null, 'cx', cx);
    circleEl.setAttributeNS(null, 'cy', cy);
    circleEl.setAttributeNS(null, 'r', centerRadius);
    circleEl.setAttributeNS(null, 'style', 'fill: ' + theme.needleCenterFillColor + '; stroke: ' + pSBC(-0.5, theme.needleCenterFillColor) + '; stroke-width: 1px;' );
    el.appendChild(circleEl);
  }

  return {grpEl, needleEl};
}

const JTextField = (function (el, cx, cy, text, fontSize, anchor="middle", baseline= "hanging", color="#666666", rotateAngle=0) {

  const textEl = document.createElementNS(SVGNS, 'text');
  textEl.setAttributeNS(null, 'x', cx);
  textEl.setAttributeNS(null, 'y', cy);
  textEl.setAttributeNS(null, 'style', 'font-family: Alkatra, normal;');
  textEl.setAttributeNS(null, 'text-anchor', anchor);
  //textEl.setAttributeNS(null, 'stroke', color);
  textEl.setAttributeNS(null, 'fill', color);
  textEl.setAttributeNS(null, 'font-size', fontSize + 'px');
  textEl.setAttributeNS(null, 'dominant-baseline', baseline);

  if(rotateAngle !== 0 && rotateAngle !== null ){
    textEl.setAttributeNS(null, "transform", "rotate(" + rotateAngle + ", " + cx + ", " + cy + ")")
  }

  textEl.innerHTML = text;

  el.appendChild(textEl);

  function getBoundingRect() {
    return textEl.getBBox();
  }
  function setPos(x, y) {
    textEl.setAttributeNS(null, 'x', x);
    textEl.setAttributeNS(null, 'y', y);
  }
  function setText(text) {
    textEl.innerHTML = text;
  }
  function setVisibility(visibility) {
    textEl.setAttributeNS(null, 'display', visibility ? 'bock' : 'none');
  }
  function setAlign(hor, ver) {
    textEl.setAttributeNS(null, 'text-anchor', hor);
    textEl.setAttributeNS(null, 'dominant-baseline', ver);
  }
  return {
    textEl,
    setPos,
    setText,
    setAlign,
    setVisibility,
    getBoundingRect
  }
})

const JNeedle = (function (el, cx, cy, gaugeWidth, aspectRatio, theme, isCompact, settings) {

  let oldAngle = 0;

  const a = gaugeWidth * 0.5;
  const b = gaugeWidth * 0.5 * aspectRatio;
  const centerRadius = gaugeWidth/20;
  const nw=centerRadius * 0.5;

  const needleEl = js_addNeedle(el, cx, cy, theme, isCompact, centerRadius);
  jg_moveNeedle(needleEl,  cx, cy, 0, a, b, nw, isCompact, centerRadius, settings);

  function render(angle) {

    jg_moveNeedle(needleEl,  cx, cy, angle, a, b, nw, isCompact, centerRadius, settings);

    oldAngle = angle;
  }
  return {render};

});

const isColor = str => str && str.length === 7 && str.charAt(0) === "#";

const setRangeHightLightColor = (value, els, range, rangeColors) => {

  els.map((el,i) => {
    let color = setGaugeColor(value,range, rangeColors);
    let inactiveColor = pSBC(-0.75, rangeColors[i]);
    //let inactiveColor = rangeColors[i].slice(0, -2) + "22";

    el.style.stroke = color === rangeColors[i] ? el.style.stroke : inactiveColor;

  });
}


const JGauge = (function (el, ...args) {

  let errorCode = 0;
  let options = {};
  let themeColor;
  let themeName;

  if (!(el instanceof HTMLElement)){
    errorCode = 1;
  }
  else if(args.length === 0) {
  }
  else if(args.length === 1){

    if ((typeof args[0] === 'string' || args[0] instanceof String) && args[0].length > 0
    && args[0].charAt(0) !== "#"){
      themeName = args[0];
    }
    else if(isColor(args[0])) {
      themeColor = args[0]
    }
    else if (typeof args[0] === 'object' && args[0] !== null) {
      options = args[0];
    }
    else {
      errorCode = 2;
    }
  }
  else if(args.length > 1 && args.length < 3){

    if (typeof args[0] === 'object' && args[0] !== null) {
      options = args[0];
    }

    if ((typeof args[1] === 'string' || args[1] instanceof String) && args[1].length > 0
      && args[1].charAt(0) !== "#"){
      themeName = args[1];
    }
    else if(isColor(args[1])) {
      themeColor = args[1]
    }
    else {
      errorCode = 4;
    }
  }
  else {
    errorCode = 3;
  }

  if(errorCode > 0){
    console.error("USAGE: ", "JGauge(el, [options], [mainColorCode]" );

    switch(errorCode){
      case 1:
        console.error("HTML EL is missing or not valid");
        break;
      case 2:
        console.error("Second argument is not valid settings object or color code or theme name");
        break;
      case 3:
        console.error("Too many arguments");
      case 4:
        console.error("Third argument is not valid color code or theme name");
        break;
      default:
        console.error("UNKNOWN ERROR");
    }
    return {render: errorHandler}
  }

  const settings = {...defaultSettings, ...options};

  if(themeColor)  {
    themeName = "custom";
    colorThemes[themeName].baseColor = themeColor     ;
  }
  else if(!colorThemes[themeName]){

    if(colorThemes[settings.theme]){
      themeName = settings.theme;
    }
    else {
      themeName = "default";
    }
  }

  settings.themeName = themeName;

  settings.theme = {...colorThemes["default"], ...colorThemes[themeName]};

  if(settings.rangeColorAdjust){
    settings.rangeColors = settings.rangeColors.map(c => pSBC(settings.rangeColorAdjust, c));
  }

  //settings.theme = {...colorThemes[themeName]};

  createDerivedSettings(settings, el);

  const layouts = createLayout(el, settings);
  const svgLayouts = createSvgLayout(layouts.rootGaugeEl, settings);

  gaugeList.push(settings.name);

  const needle = JNeedle(svgLayouts.svgEl, settings.cx, settings.cy, settings.width,
    settings.aspectRatio, settings.theme, settings.compact, settings);

  function errorHandler() {

  }
    function render(value) {

    const angle = (value - settings.min) / (settings.max - settings.min) * settings.totalAngle;

    if(settings.highLightActiveRange)  {
        setRangeHightLightColor(value,  svgLayouts.rangeSvgEls, settings.rangeValues, settings.rangeColors);

    }
    svgLayouts.svgValueField.setText(parseFloat(value).toFixed(settings.precision));
    needle.render(js_valueToAngle90(value, settings));
  }

  return {render};
});

const JGraph = (function (el, list) {

  const len = list.length;
  const combinedWidth = list.reduce((tot, curr) => tot += curr.size, 0);
  const graphWrapper = addDivWrapper(el, "graph-wrapper", "");
  const svgEl = addSvgElement(graphWrapper, combinedWidth, 100, "#ffffff");


});

const calculateGaugeSize = (targetWidth, totalBorderWidth, mult) => {


  //const targetWidth =   x + totalBorderWidth * x * mult;
  //const targetWidth =   x * ( 1 + totalBorderWidth * mult);
  return Math.ceil(targetWidth /  ( 1 + totalBorderWidth * mult*2));
};


const defaultCommonSettings = {
  size: 100,
  panelTitle: "",
  enableCompare: false
}
const JGaugePanel = (function (el, customCommonSettings, list, cols=3) {

  let themeName;
  let theme;
  const panelWrapper = addDivWrapper(el, "panel-wrapper", "");
  let comparisonWrapper;
  let titleWrapper;

  const commonSettings = {...defaultCommonSettings, ...customCommonSettings }
  if(commonSettings.themeColor)  {
    themeName = "custom";
    colorThemes[themeName].baseColor = commonSettings.themeColor;
  }
  else if(commonSettings.themeName){

    if(colorThemes[commonSettings.themeName]){
      themeName = commonSettings.themeName;
    }
    else {
      themeName = "default";
    }
  }

  theme = {...colorThemes[themeName]};

  commonSettings.theme = themeName;

  const panelPadding = commonSettings.size / 20*0;
  commonSettings.margin = commonSettings.size / 10;

  const totalBorderWidth = theme.gaugeBorders ? theme.gaugeBorders.reduce((tot, curr) => tot += minBorder(curr.width) ,0) : 0;

  //const panelWidth = panelWrapper.clientWidth - 2 * panelPadding;
  const panelWidth = (commonSettings.panelWidth || panelWrapper.clientWidth ) - 2 * panelPadding;

  //const maxGaugeWidth = Math.floor(panelWidth / cols) - 2*commonSettings.margin;
  const maxGaugeWidth = Math.floor(panelWidth / cols) - 2*commonSettings.margin -
    (commonSettings.majorLabels || commonSettings.minorLabels ? 0 :
    theme.gaugeBorders[theme.gaugeBorders.length-1].width*2 );

  commonSettings.size = calculateGaugeSize(maxGaugeWidth, totalBorderWidth, BORDERSCALE);
  console.log(panelWidth, totalBorderWidth, maxGaugeWidth, commonSettings.size)

  panelWrapper.setAttribute('style', (panelWrapper.getAttribute('style')|| "") + 'padding: ' + panelPadding + 'px;');

  if(commonSettings.panelTitle){
    titleWrapper = addDivWrapper(panelWrapper, "panel-title", commonSettings.panelTitle);
  }

  const experimentals = list.map(e => commonSettings.themeColor ? JGauge(panelWrapper,
    {...commonSettings, ...e},
    commonSettings.themeColor): JGauge(panelWrapper,{...commonSettings,...e}));

  if(commonSettings.enableCompare){
    comparisonWrapper = addDivWrapper(el, "comparison-wrapper", "COMPARISON");
    const graph = JGraph(comparisonWrapper, list);
  }



  function render(value) {

  }
  return experimentals;

});

export {
  JGauge,
  JGaugePanel
}
