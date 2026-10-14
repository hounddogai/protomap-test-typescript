import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientModelNotice } from "./lenient-model-notice.js";

/** One step of the lenient model notice calculation. */
export interface LenientModelNoticeStep {
  describe(): string;
  adjust(item: LenientModelNotice, value: number): number;
}

export class FlaggedLenientModelNoticeAdjuster implements LenientModelNoticeStep {
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

  adjust(item: LenientModelNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientModelNoticeAdjuster implements LenientModelNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientModelNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientModelNoticeAdjuster implements LenientModelNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientModelNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapLenientModelNoticeAdjuster implements LenientModelNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientModelNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientModelNoticeAdjuster implements LenientModelNoticeStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientModelNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient model notice steps in order and keeps a trace of each. */
export class LenientModelNoticeEngine {
  steps: LenientModelNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientModelNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientModelNotice): number {
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

  evaluateAll(items: LenientModelNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientModelNoticeEngine(flagsValue: flags.Registry): LenientModelNoticeEngine {
  return new LenientModelNoticeEngine(
    [
      new FlaggedLenientModelNoticeAdjuster(flagsValue, "lenient-model-notice-fallback", -3.1),
      new TieredLenientModelNoticeAdjuster([2098, 2987], [1.1, 0.95]),
      new PercentLenientModelNoticeAdjuster(-18.5),
      new CapLenientModelNoticeAdjuster(49153),
      new MinimumLenientModelNoticeAdjuster(33.6),
    ],
    [],
    3.5,
    95221.3,
  );
}
