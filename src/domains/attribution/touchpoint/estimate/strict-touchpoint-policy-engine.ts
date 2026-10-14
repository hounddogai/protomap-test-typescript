import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

/** One step of the strict touchpoint policy calculation. */
export interface StrictTouchpointPolicyFactor {
  describe(): string;
  adjust(item: StrictTouchpointPolicy, value: number): number;
}

export class RoundingStrictTouchpointPolicyAdjuster implements StrictTouchpointPolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictTouchpointPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class StrictTouchpointPolicyWindowDaysOffsetAdjuster implements StrictTouchpointPolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: StrictTouchpointPolicy, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class FlaggedStrictTouchpointPolicyAdjuster implements StrictTouchpointPolicyFactor {
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

  adjust(item: StrictTouchpointPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentStrictTouchpointPolicyAdjuster implements StrictTouchpointPolicyFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictTouchpointPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictTouchpointPolicyAdjuster implements StrictTouchpointPolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictTouchpointPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the strict touchpoint policy steps in order and keeps a trace of each. */
export class StrictTouchpointPolicyEngine {
  steps: StrictTouchpointPolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictTouchpointPolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictTouchpointPolicy): number {
    let current = item.netExposure();
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

  evaluateAll(items: StrictTouchpointPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictTouchpointPolicyEngine(flagsValue: flags.Registry): StrictTouchpointPolicyEngine {
  return new StrictTouchpointPolicyEngine(
    [
      new RoundingStrictTouchpointPolicyAdjuster(0.05),
      new StrictTouchpointPolicyWindowDaysOffsetAdjuster(0.87),
      new FlaggedStrictTouchpointPolicyAdjuster(flagsValue, "strict-touchpoint-policy-regional", 5.6),
      new PercentStrictTouchpointPolicyAdjuster(-5.9),
      new MinimumStrictTouchpointPolicyAdjuster(18),
    ],
    [],
    1.9,
    84610.7,
  );
}
