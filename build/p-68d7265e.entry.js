import{r as e,h as t,g as l,H as n}from"./p-84786d27.js";const i=":host{display:block}.form{display:grid;gap:1rem;grid-template-columns:1fr 1fr}.stl-files{display:grid;gap:1rem;grid-template-columns:repeat(3, 1fr);max-width:100%}.stl-files>div{border:1px solid gray;text-align:center;padding:1rem;display:flex;flex-direction:column;justify-content:space-between}.stl-files>div a img{max-width:100%}";const s=class{constructor(t){e(this,t);this.originalGcode=undefined;this.result=undefined;this.adjustmentValue=undefined;this.showInstructions=undefined;this.minmm=undefined;this.maxmm=undefined;this.minEm=undefined;this.maxEm=undefined;this.topOnly=undefined}handleSelectedRange(){this.processFile(this.adjustmentValue)}processFile(e){this.getLayers(this.originalGcode).then((t=>{this.result=this.generateResult(t,e)}))}generateResult(e,t){var l=[];for(var n=0;n<e.length;n++){var i=e[n];if(this.topOnly&&n===e.length-1){var s=this.generateNewLayer(i,t);l.push(s)}else if(!this.topOnly&&n>1){var s=this.generateNewLayer(i,t);l.push(s)}else{l.push(i)}}return l.join("\n")}generateNewLayer(e,t){const l=e.split("\n");const n=[];const i=this.getMinX(e);const s=this.getMaxX(e);let r=null;l.forEach((e=>{const l=this.adjustLine(e,i,s,t,r);n.push(l);const a=this.extractXValue(e);if(a!==null){r=a}}));return n.join("\n")}adjustLine(e,t,l,n,i){if(!this.isExtrusionLine(e)){return e}const s=this.extractXValue(e);if(s!==null&&i!==null){const r=(s+i)/2;const a=(r-t)/(l-t);const o=1+n/100*(2*a-1);return this.applyEAdjustment(e,o)}return e}applyEAdjustment(e,t){const l=e.match(/E(-?\d+(\.\d+)?)/);if(l&&l[1]){const n=parseFloat(l[1]);const i=n*t;const s=e.replace(/E-?\d+(\.\d+)?/,`E${i.toFixed(5)}`);return`${s} ; E adjustment: ${t}`}return e}extractXValue(e){const t=e.match(/X(\d+\.\d+)/);if(t){return parseFloat(t[1])}return null}isExtrusionLine(e){return e.startsWith("G1")&&e.includes("E")}getMinX(e){var t=1e5;var l=e.split("\n");for(var n of l){var i=this.getX(n);if(i&&i<t){t=i}}return t}getMaxX(e){var t=-1e5;var l=e.split("\n");for(var n of l){var i=this.getX(n);if(i&&i>t){t=i}}return t}getX(e){if(e.startsWith(";")){return null}if(!e.startsWith("G1")){return null}var t=e.match(/X(-?\d+(\.\d+)?)/);if(t&&t[1]){return Number.parseFloat(t[1])}return null}getExtrusion(e){var t=e.match(/E\d+\.\d+/);if(t){return t[0]}return null}async getLayers(e){return new Promise(((t,l)=>{var n=new FileReader;n.onload=e=>{var l=e.target.result.split("\n");var n=[];var i="";for(var s of l){if(s.startsWith(";LAYER")){if(i!=""){n.push(i)}i=""}i+=s+"\n"}if(i!=""){n.push(i)}t(n)};try{n.readAsText(e)}catch(e){l(e)}}))}setMinmm(e){const t=Number.parseFloat(e);if(!isNaN(t)){this.minmm=t;var l=this.getEmForMm(t);this.minEm=parseFloat(l.toFixed(5))}}setMaxmm(e){const t=Number.parseFloat(e);if(!isNaN(t)){this.maxmm=t;var l=this.getEmForMm(t);this.maxEm=parseFloat(l.toFixed(5))}}getEmForMm(e){return 1+this.adjustmentValue/100*(2*e/100-1)}render(){var e;return t(n,null,t("h1",null,"EM Calibrator"),t("fieldset",null,t("legend",null,"Introduction"),t("p",null,"This tool simply takes a gcode file and adjustes the extrusion multiplier (EM) left to right as a gradient. It allows inspecting the effets of EM values on a single print to either calibrate quicker or with a lot of precision."),t("p",null,"Before using this tool, you should have:",t("ul",null,t("li",null,"Calibrated your extruder."),t("li",null,"Have good bed adhesion."),t("li",null,"Have a good first layer squish."),t("li",null,"Tuned pressure advance or linear advance.")),t("a",{href:"https://ellis3dp.com/Print-Tuning-Guide/"},"Ellis' Print Tuning Guide")," is a great guide for calibration, I recommend following the guide up to EM Calibration and returning to it after using this tool for the rest of your calibrations.")),t("fieldset",null,t("legend",null,"Download and slice"),t("p",null,"Start by downloading one of these files:"),t("div",{class:"stl-files"},t("div",null,t("a",{href:l("./assets/Tolerance-100mm.stl")},t("img",{src:l("./assets/Tolerance-100mm.jpg"),alt:"Normal tolerance test."})),t("p",null,"Great for calibrating EM for 0.1mm tolerances.")),t("div",null,t("a",{href:l("./assets/spring-100mm.stl")},t("img",{src:l("./assets/spring-100mm.jpg"),alt:"Spring test."})),t("p",null,"Great if you want to calibrate quick.")),t("div",null,t("a",{href:l("./assets/top-100mm.stl")},t("img",{src:l("./assets/top-100mm.png"),alt:"Spring test."})),t("p",null,"Great to calibrate top layer surface quality."))),t("p",null,"Use your normal print settings but ensure that:"),t("ul",null,t("li",null,"You reduce your normal flow by at least the same percentage as the calibration amount. (If you are doing +-50%, reduce your flow by 50%). We can tune for speed later.")),t("ul",null,t("li",null,"Your infill is at 45 degrees from the rectangle."),t("li",null,"You have at least 2 layers of sparse infill to decouple the top layers from any first layer issues."))),t("fieldset",null,t("legend",null,"Upload your gcode"),t("p",null,"Upload your gcode file here:"),t("input",{type:"file",id:"gcode",name:"gcode",accept:".gcode",onChange:e=>this.originalGcode=e.target.files[0]})),this.originalGcode&&t("fieldset",null,t("legend",null,"Settings"),t("label",null,"Top Only: "),t("input",{type:"checkbox",checked:this.topOnly,onChange:e=>this.topOnly=e.target.checked}),t("br",null),t("label",null,"Extrusion Multiplier Range: "),t("select",{onChange:e=>{this.adjustmentValue=parseInt(e.target.value);this.handleSelectedRange()}},t("option",{value:""},"-- Select an option --"),t("option",{value:50},"+- 50%"),t("option",{value:20},"+- 20%"),t("option",{value:10},"+- 10%"),t("option",{value:5},"+- 5%"),t("option",{value:2},"+- 2%"),t("option",{value:1},"+- 1%")),t("br",null)),this.result&&t("fieldset",null,t("legend",null,"Download And Print"),t("p",null,"Download the result  ",t("a",{href:`data:text/plain;charset=utf-8,${encodeURIComponent(this.result)}`,download:`em-calibrated${this.adjustmentValue}.gcode`,onClick:()=>this.showInstructions=true},"here"),".")),this.showInstructions&&t("fieldset",null,t("legend",null,"Instructions"),t("p",null,"Print the downloaded file."),t("p",null,"Bend and twist and stretch the striped band lightly."),t("p",null,"Measure milimeters from the left (-) side to where the band did not property separate. This is the ",t("strong",null,"Maximum")," EM you could use and still be able to print with 0.1 or 0.2 tolerances.",t("em",null,"One side has all 0.1mm clearances and the other side all 0.2mm clearances. If one side completelly does not come apart, you either need to do an extruder calibration or your printer is not precise enough for 0.1mm tolerances.")),t("p",null,"For the 100mm x 50mm rectangle, measure how many mm from the left (-) side look underextruded, this is your ",t("string",null,"Minimum")," EM you can set."),t("fieldset",null,t("legend",null,"Calculations"),t("div",{class:"form"},t("label",null,"Minimum mm: "),t("input",{type:"range",step:1,min:0,max:100,value:this.minmm,onInput:e=>this.setMinmm(e.target.value)}),t("label",null,"Minimum mm: "),t("span",null,this.minmm),t("label",null,"Minimum EM: "),t("span",null,this.minEm),t("label",null,"Maximum mm: "),t("input",{type:"number",value:this.maxmm,onInput:e=>this.setMaxmm(e.target.value)}),t("label",null,"Maximum EM: "),t("span",null,this.maxEm),t("label",null,"Average EM: "),t("span",null,(this.minEm+this.maxEm)/2),t("label",null,"EM range: "),t("span",null,(e=this.minEm&&this.maxEm&&(this.maxEm-this.minEm)/((this.minEm+this.maxEm)/2)*100/2)===null||e===void 0?void 0:e.toFixed(5))))))}static get assetsDirs(){return["assets"]}};s.style=i;export{s as em_calibrator};
//# sourceMappingURL=p-68d7265e.entry.js.map