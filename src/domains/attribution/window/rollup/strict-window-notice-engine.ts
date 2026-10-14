import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictWindowNotice } from "./strict-window-notice.js";

/** One step of the strict window notice calculation. */
export interface StrictWindowNoticeModifier {
  describe(): string;
  adjust(item: StrictWindowNotice, value: number): number;
}

export class PercentStrictWindowNoticeAdjuster implements StrictWindowNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictWindowNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumStrictWindowNoticeAdjuster implements StrictWindowNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictWindowNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedStrictWindowNoticeAdjuster implements StrictWindowNoticeModifier {
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

  adjust(item: StrictWindowNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelStrictWindowNoticeAdjuster implements StrictWindowNoticeModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictWindowNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredStrictWindowNoticeAdjuster implements StrictWindowNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictWindowNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict window notice steps in order and keeps a trace of each. */
export class StrictWindowNoticeEngine {
  steps: StrictWindowNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWindowNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictWindowNotice): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: StrictWindowNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictWindowNoticeEngine(flagsValue: flags.Registry): StrictWindowNoticeEngine {
  return new StrictWindowNoticeEngine(
    [
      new PercentStrictWindowNoticeAdjuster(11),
      new MinimumStrictWindowNoticeAdjuster(27.1),
      new FlaggedStrictWindowNoticeAdjuster(flagsValue, "strict-window-notice-regional", 6.3),
      new ChannelStrictWindowNoticeAdjuster(new Map<string, number>([["north", 0.97]])),
      new TieredStrictWindowNoticeAdjuster([3806, 6651], [1.14, 0.94]),
    ],
    [],
    2.6,
    81391.7,
  );
}
