import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultPayoutTarget } from "./default-payout-target.js";

/** One step of the default payout target calculation. */
export interface DefaultPayoutTargetStep {
  describe(): string;
  adjust(item: DefaultPayoutTarget, value: number): number;
}

export class CapDefaultPayoutTargetAdjuster implements DefaultPayoutTargetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultPayoutTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultPayoutTargetAdjuster implements DefaultPayoutTargetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultPayoutTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultPayoutTargetAdjuster implements DefaultPayoutTargetStep {
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

  adjust(item: DefaultPayoutTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default payout target steps in order and keeps a trace of each. */
export class DefaultPayoutTargetEngine {
  steps: DefaultPayoutTargetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultPayoutTargetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultPayoutTarget): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: DefaultPayoutTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultPayoutTargetEngine(flagsValue: flags.Registry): DefaultPayoutTargetEngine {
  return new DefaultPayoutTargetEngine(
    [
      new CapDefaultPayoutTargetAdjuster(33316),
      new RoundingDefaultPayoutTargetAdjuster(0.25),
      new FlaggedDefaultPayoutTargetAdjuster(flagsValue, "default-payout-target-strict", -3.7),
    ],
    [],
    1,
    49720.5,
  );
}
