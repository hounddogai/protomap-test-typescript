import * as flags from "../../../../kit/flags.js";
import { TouchpointException } from "./touchpoint-exception.js";

/** One step of the touchpoint exception calculation. */
export interface TouchpointExceptionModifier {
  describe(): string;
  adjust(item: TouchpointException, value: number): number;
}

export class SegmentTouchpointExceptionAdjuster implements TouchpointExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TouchpointException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTouchpointExceptionAdjuster implements TouchpointExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TouchpointException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTouchpointExceptionAdjuster implements TouchpointExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TouchpointExceptionRatioOffsetAdjuster implements TouchpointExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: TouchpointException, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class FlaggedTouchpointExceptionAdjuster implements TouchpointExceptionModifier {
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

  adjust(item: TouchpointException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the touchpoint exception steps in order and keeps a trace of each. */
export class TouchpointExceptionEngine {
  steps: TouchpointExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TouchpointException): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: TouchpointException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTouchpointExceptionEngine(flagsValue: flags.Registry): TouchpointExceptionEngine {
  return new TouchpointExceptionEngine(
    [
      new SegmentTouchpointExceptionAdjuster(new Map<string, number>([["central", 0.94], ["retail", 1.16]])),
      new MinimumTouchpointExceptionAdjuster(36.2),
      new CapTouchpointExceptionAdjuster(39698),
      new TouchpointExceptionRatioOffsetAdjuster(1.91),
      new FlaggedTouchpointExceptionAdjuster(flagsValue, "touchpoint-exception-legacy", 2.2),
    ],
    [],
    2.6,
    14305.5,
  );
}
