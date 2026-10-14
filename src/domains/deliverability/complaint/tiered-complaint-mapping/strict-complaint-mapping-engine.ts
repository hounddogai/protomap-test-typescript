import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictComplaintMapping } from "./strict-complaint-mapping.js";

/** One step of the strict complaint mapping calculation. */
export interface StrictComplaintMappingAdjuster {
  describe(): string;
  adjust(item: StrictComplaintMapping, value: number): number;
}

export class PercentStrictComplaintMappingAdjuster implements StrictComplaintMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictComplaintMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStrictComplaintMappingAdjuster implements StrictComplaintMappingAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: StrictComplaintMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictComplaintMappingAdjuster implements StrictComplaintMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictComplaintMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict complaint mapping steps in order and keeps a trace of each. */
export class StrictComplaintMappingEngine {
  steps: StrictComplaintMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictComplaintMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictComplaintMapping): number {
    let current = item.projectedLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: StrictComplaintMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictComplaintMappingEngine(flagsValue: flags.Registry): StrictComplaintMappingEngine {
  return new StrictComplaintMappingEngine(
    [
      new PercentStrictComplaintMappingAdjuster(14.4),
      new FlaggedStrictComplaintMappingAdjuster(flagsValue, "strict-complaint-mapping-strict", -2.5),
      new MinimumStrictComplaintMappingAdjuster(2.1),
    ],
    [],
    3.5,
    77846,
  );
}
