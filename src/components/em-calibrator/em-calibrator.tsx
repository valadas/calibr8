import { Component, Host, getAssetPath, h, State } from '@stencil/core';

@Component({
  tag: 'em-calibrator',
  styleUrl: 'em-calibrator.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
export class EmCalibrator {

  @State() originalGcode: File;
  @State() result: string;
  @State() adjustmentValue: number;
  @State() showInstructions: boolean;
  @State() minmm: number;
  @State() maxmm: number;
  @State() minEm: number;
  @State() maxEm: number;
  @State() topOnly: boolean;

  handleSelectedRange(): void {
    this.processFile(this.adjustmentValue);
  }

  processFile(range: number) {
    this.getLayers(this.originalGcode)
    .then(layers => {
        this.result = this.generateResult(layers, range);
      });
  }

  generateResult(layers: string[], range: number): string {
    var newLayers: string[] = [];
    for (var i = 0; i < layers.length; i++)
    {
      var layer = layers[i];

      // If topOnly is true, only modify the last layer
      if (this.topOnly && i === layers.length - 1)
      {
          var newLayer = this.generateNewLayer(layer, range);
          newLayers.push(newLayer);
      }
      else if (!this.topOnly && i > 1)
      {
          var newLayer = this.generateNewLayer(layer, range);
          newLayers.push(newLayer);
      }
      else
      {
          // If not the last layer (or if topOnly is false), add the layer as it is
          newLayers.push(layer);
      }
    }
    
    return newLayers.join("\n");
  }

  generateNewLayer(layer: string, range: number): string {
    const lines = layer.split("\n");
    const newLines: string[] = [];
    const minX = this.getMinX(layer);
    const maxX = this.getMaxX(layer);
    let previousX: number | null = null;

    lines.forEach(line => {
      const adjustedLine = this.adjustLine(line, minX, maxX, range, previousX);
      newLines.push(adjustedLine);

      const currentX = this.extractXValue(line);
      if (currentX !== null) {
          previousX = currentX;
      }
    })

    return newLines.join("\n");
  }

  adjustLine(line: string, minX: number, maxX: number, range: number, previousX: number): string {
    if (!this.isExtrusionLine(line)){
      return line;
    }

    const currentX = this.extractXValue(line);
    if (currentX !== null && previousX !== null) {
        const averageX = (currentX + previousX) / 2;
        const ratio = (averageX - minX) / (maxX - minX);
        const eAdjustment = 1 + (range / 100) * (2 * ratio - 1);

        // Apply the adjustment to the E value
        return this.applyEAdjustment(line, eAdjustment);
    }

      return line;
  }

  applyEAdjustment(line: string, eAdjustment: number): string {
    const eValueMatch = line.match(/E(-?\d+(\.\d+)?)/);
    if (eValueMatch && eValueMatch[1]) {
        const originalEValue = parseFloat(eValueMatch[1]);
        const adjustedEValue = originalEValue * eAdjustment;
        const newLine = line.replace(/E-?\d+(\.\d+)?/, `E${adjustedEValue.toFixed(5)}`);
        return `${newLine} ; E adjustment: ${eAdjustment}`
    }

    return line;
  }

  extractXValue(line: string) {
    const match = line.match(/X(\d+\.\d+)/);
    if (match) {
        return parseFloat(match[1]);
    }
    return null;
  }
  
  isExtrusionLine(line: string) {
    return line.startsWith("G1") && line.includes("E");
  }

  getMinX(layer: string) {
    var minX = 100000;
    var lines = layer.split("\n");
    for (var line of lines) {

      var x = this.getX(line);
      if (x && x < minX) {
        minX = x;
      }
    }
    return minX;
  }

  getMaxX(layer: string) {
    var maxX = -100000;
    var lines = layer.split("\n");
    for (var line of lines) {
      var x = this.getX(line);
      if (x && x > maxX) {
        maxX = x;
      }
    }
    return maxX;
  }
  
  getX(line: string): number {
    if (line.startsWith(";")) {
      return null;
    }

    if (!line.startsWith("G1")) {
      return null;
    }

    var match = line.match(/X(-?\d+(\.\d+)?)/);
    if (match && match[1]) {
      return Number.parseFloat(match[1]);
    }
    return null;
  }

  getExtrusion(line: string) {
    var extrusion = line.match(/E\d+\.\d+/);
    if (extrusion) {
      return extrusion[0];
    }
    return null;
  }

  async getLayers(originalGcode: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = (e) => {
        var lines = (e.target as any).result.split('\n');
        var layers = [];
        var layer = "";
        for (var line of lines) {
          if (line.startsWith(";LAYER")) {
            if (layer != "") {
              layers.push(layer);
            }
            layer = "";
          }
          layer += line + "\n";
        }

        // After the loop, push the last layer if it is not empty
        if (layer != "") {
          layers.push(layer);
        }

        resolve(layers);
      }
      try {
        reader.readAsText(originalGcode);
      }
      catch (e) {
        reject(e);
      }
    });
  }

  private setMinmm(value: string): void {
    const minmm = Number.parseFloat(value);
    if (!isNaN(minmm)){
      this.minmm = minmm;
      var minEm = this.getEmForMm(minmm);
      this.minEm = parseFloat(minEm.toFixed(5));
    }
  }
  
  setMaxmm(value: string): void {
    const maxmm = Number.parseFloat(value);
    if (!isNaN(maxmm)){
      this.maxmm = maxmm;
      var maxEm = this.getEmForMm(maxmm);
      this.maxEm = parseFloat(maxEm.toFixed(5));
    }
  }

  getEmForMm(mm: number) {
    return 1 + (this.adjustmentValue / 100) * (2 * mm / 100 - 1);
  }

  render() {
    return (
      <Host>
        <h1>EM Calibrator</h1>
        <fieldset>
          <legend>Introduction</legend>
          <p>
            This tool simply takes a gcode file and adjustes the extrusion multiplier (EM) left to right as a gradient.
            It allows inspecting the effets of EM values on a single print to either calibrate quicker or with a lot of precision.
          </p>
          <p>
            Before using this tool, you should have:
            <ul>
              <li>Calibrated your extruder.</li>
              <li>Have good bed adhesion.</li>
              <li>Have a good first layer squish.</li>
              <li>Tuned pressure advance or linear advance.</li>
            </ul>
            <a href="https://ellis3dp.com/Print-Tuning-Guide/">Ellis' Print Tuning Guide</a> is a great guide for calibration,
            I recommend following the guide up to EM Calibration and returning to it after using this tool for the rest of your calibrations.
          </p>
        </fieldset>
        <fieldset>
          <legend>Download and slice</legend>
          <p>Start by downloading one of these files:</p>
          <div class="stl-files">
            <div>
              <a href={getAssetPath("./assets/Tolerance-100mm.stl")}>
                <img src={getAssetPath("./assets/Tolerance-100mm.jpg")} alt="Normal tolerance test." />
              </a>
              <p>Great for calibrating EM for 0.1mm tolerances.</p>
            </div>
            <div>
              <a href={getAssetPath("./assets/spring-100mm.stl")}>
                <img src={getAssetPath("./assets/spring-100mm.jpg")} alt="Spring test." />
              </a>
              <p>Great if you want to calibrate quick.</p>
            </div>
            <div>
              <a href={getAssetPath("./assets/top-100mm.stl")}>
                <img src={getAssetPath("./assets/top-100mm.png")} alt="Spring test." />
              </a>
              <p>Great to calibrate top layer surface quality.</p>
            </div>
          </div>
          <p>Use your normal print settings but ensure that:</p>
          <ul>
            <li>You reduce your normal flow by at least the same percentage as the calibration amount. (If you are doing +-50%, reduce your flow by 50%). We can tune for speed later.</li>
            <li>Do <strong>not</strong> use a skirt or brim, this would interfere with the math of this tool.</li>
            <li>The part needs to be oriented with the long side in the X axis, do not turn it.</li>
          </ul>
          <p>If you are tuning for top surface quality further ensure that:</p>
          <ul>
            <li>Your infill is at 45 degrees from the rectangle.</li>
            <li>You have at least 2 layers of sparse infill to decouple the top layers from any first layer issues.</li>
            <li>Adding more top layers helps for top layer calibration (I like 10 or 11 with 0.2mm layer height.) If you use very high layers with large nozzles, you can scale the model in the z axis to give more height.</li>
          </ul>
        </fieldset>

        <fieldset>
          <legend>Upload your gcode</legend>
          <p>Upload your sliced gcode file here:</p>
          <input
            type="file"
            id="gcode"
            name="gcode"
            accept=".gcode"
            onChange={(e) => this.originalGcode = (e.target as HTMLInputElement).files[0]}
          />
        </fieldset>

        {this.originalGcode && 
          <fieldset>
            <legend>Settings</legend>
            <em>This tool will overextrude (potentially a lot if you pick 50% or 20%). Make sure to keep an eye on the print.</em><br /><br />
            <label>Top Only (useful to calibrate top layer EM): </label>
            <input type="checkbox" checked={this.topOnly} onChange={(e) => this.topOnly = (e.target as HTMLInputElement).checked}/>
            <br />
            <label>Extrusion Multiplier Range: </label>
            <select
              onChange={(e) => {
                this.adjustmentValue = parseInt((e.target as HTMLSelectElement).value);
                this.handleSelectedRange();
              }}
              onFocus={() => {
                this.result = undefined;
                this.showInstructions = false;
              }}
            >
              <option value="">-- Select an option --</option>
              <option value={50}>+- 50%</option>
              <option value={20}>+- 20%</option>
              <option value={10}>+- 10%</option>
              <option value={5}>+- 5%</option>
              <option value={2}>+- 2%</option>
              <option value={1}>+- 1%</option>
            </select>
            <br />
          </fieldset>
        }
        {this.result &&
          <fieldset>
            <legend>Download And Print</legend>
            <p>Download the result &nbsp;
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(this.result)}`}
                download={`em-calibration_${this.adjustmentValue}.gcode`}
                onClick={() => this.showInstructions = true}
              >
                here
              </a>
            .</p>
          </fieldset>
        }
        {this.showInstructions &&
          <fieldset>
            <legend>Instructions</legend>
            <p>Print the downloaded file.</p>
            <fieldset>
              <legend>Interpreting the results</legend>
              <p>Find the best spot on the part and measure its distance from the left.</p>
                <label>Best spot mm: </label>
                <input type="range" step={1} min={0} max={100} value={this.minmm} onInput={e => this.setMinmm((e.target as HTMLInputElement).value)}/>
                <span>{this.minmm}</span> mm
                <br />
                {this.minEm &&
                <div>
                  <p>Multiply your current EM value (in your slicer) by: {this.minEm}</p>
                  <p>If you want further precision, reslice the file and reupload above then pick a lower EM Range value.</p>
                </div>
                }
            </fieldset>
          </fieldset>
        }
      </Host>
    );
  }
}
