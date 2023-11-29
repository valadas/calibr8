import { Component, Host, getAssetPath, h, State } from '@stencil/core';

@Component({
  tag: 'em-calibrator',
  styleUrl: 'em-calibrator.css',
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
          <legend>Download and slice</legend>
          <p>Start by downloading <a href={getAssetPath("./assets/em.stl")}>this model</a> and slice it with your slicer of choice.</p>
          <p>Use your normal print settings but ensure that:</p>
          <ul>
            <li>Your infill is at 45 degrees from the rectangle.</li>
            <li>You have at least 2 layers of sparse infill to decouple the top layers from any first layer issues.</li>
          </ul>
        </fieldset>

        <fieldset>
          <legend>Upload your gcode</legend>
          <p>Upload your gcode file here:</p>
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
            <label>Top Only: </label>
            <input type="checkbox" checked={this.topOnly} onChange={(e) => this.topOnly = (e.target as HTMLInputElement).checked}/>
            <br />
            <label>Extrusion Multiplier Range: </label>
            <select
              onChange={(e) => {
                this.adjustmentValue = parseInt((e.target as HTMLSelectElement).value);
                this.handleSelectedRange();
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
                download={`em-calibrated${this.adjustmentValue}.gcode`}
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
            <p>Bend and twist and stretch the striped band lightly.</p>
            <p>
              Measure milimeters from the left (-) side to where the band did not property separate.
              This is the <strong>Maximum</strong> EM you could use and still be able to print with 0.1 or 0.2 tolerances.
              <em>
                One side has all 0.1mm clearances and the other side all 0.2mm clearances.
                If one side completelly does not come apart, you either need to do an extruder calibration 
                or your printer is not precise enough for 0.1mm tolerances.
              </em>
            </p>
            <p>For the 100mm x 50mm rectangle, measure how many mm from the left (-) side look underextruded, this is your <string>Minimum</string> EM you can set.</p>
            <fieldset>
              <legend>Calculations</legend>
              <div class="form">
                <label>Minimum mm: </label>
                <input type="range" step={1} min={0} max={100} value={this.minmm} onInput={e => this.setMinmm((e.target as HTMLInputElement).value)}/>
                <label>Minimum mm: </label>
                <span>{this.minmm}</span>
                <label>Minimum EM: </label>
                <span>{this.minEm}</span>
                <label>Maximum mm: </label>
                <input type="number" value={this.maxmm} onInput={e =>this.setMaxmm((e.target as HTMLInputElement).value)}/>
                <label>Maximum EM: </label>
                <span>{this.maxEm}</span>
                <label>Average EM: </label>
                <span>{(this.minEm + this.maxEm)/2}</span>
                <label>EM range: </label>
                <span>{(this.minEm && this.maxEm && ((this.maxEm - this.minEm) / ((this.minEm + this.maxEm) / 2) * 100)/2)?.toFixed(5)}</span>
              </div>
            </fieldset>
          </fieldset>
        }
      </Host>
    );
  }
}
