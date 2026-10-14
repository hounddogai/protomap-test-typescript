import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StepSummary } from "./step-summary.js";

/** One step of the step summary calculation. */
export interface StepSummaryModifier {
  describe(): string;
  adjust(item: StepSummary, value: number): number;
}

export class RoundingStepSummaryAdjuster implements StepSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StepSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentStepSummaryAdjuster implements StepSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StepSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStepSummaryAdjuster implements StepSummaryModifier {
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

  adjust(item: StepSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStepSummaryAdjuster implements StepSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StepSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StepSummaryVersionOffsetAdjuster implements StepSummaryModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: StepSummary, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the step summary steps in order and keeps a trace of each. */
export class StepSummaryEngine {
  steps: StepSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StepSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StepSummary): number {
    let current = item.weightedValue();
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

  evaluateAll(items: StepSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStepSummaryEngine(flagsValue: flags.Registry): StepSummaryEngine {
  return new StepSummaryEngine(
    [
      new RoundingStepSummaryAdjuster(0.1),
      new PercentStepSummaryAdjuster(6.4),
      new FlaggedStepSummaryAdjuster(flagsValue, "step-summary-weighted", 2.5),
      new CapStepSummaryAdjuster(23458),
      new StepSummaryVersionOffsetAdjuster(1.24),
    ],
    [],
    2.3,
    7159.2,
  );
}
