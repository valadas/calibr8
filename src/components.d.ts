/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface EmCalibrator {
    }
}
declare global {
    interface HTMLEmCalibratorElement extends Components.EmCalibrator, HTMLStencilElement {
    }
    var HTMLEmCalibratorElement: {
        prototype: HTMLEmCalibratorElement;
        new (): HTMLEmCalibratorElement;
    };
    interface HTMLElementTagNameMap {
        "em-calibrator": HTMLEmCalibratorElement;
    }
}
declare namespace LocalJSX {
    interface EmCalibrator {
    }
    interface IntrinsicElements {
        "em-calibrator": EmCalibrator;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "em-calibrator": LocalJSX.EmCalibrator & JSXBase.HTMLAttributes<HTMLEmCalibratorElement>;
        }
    }
}
