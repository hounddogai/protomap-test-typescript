import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ComplaintTarget } from "./complaint-target.js";

/** One step of the complaint target calculation. */
export interface ComplaintTargetAdjuster {
  describe(): string;
  adjust(item: ComplaintTarget, value: number): number;
}

export class RoundingComplaintTargetAdjuster implements ComplaintTargetAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ComplaintTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedComplaintTargetAdjuster implements ComplaintTargetAdjuster {
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

  adjust(item: ComplaintTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentComplaintTargetAdjuster implements ComplaintTargetAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ComplaintTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the complaint target steps in order and keeps a trace of each. */
export class ComplaintTargetEngine {
  steps: ComplaintTargetAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ComplaintTargetAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ComplaintTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ComplaintTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultComplaintTargetEngine(flagsValue: flags.Registry): ComplaintTargetEngine {
  return new ComplaintTargetEngine(
    [
      new RoundingComplaintTargetAdjuster(5),
      new FlaggedComplaintTargetAdjuster(flagsValue, "complaint-target-legacy", 9.5),
      new PercentComplaintTargetAdjuster(-20),
    ],
    [],
    4.9,
    94390.9,
  );
}
