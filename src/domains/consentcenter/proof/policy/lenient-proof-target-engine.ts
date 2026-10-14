import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientProofTarget } from "./lenient-proof-target.js";

/** One step of the lenient proof target calculation. */
export interface LenientProofTargetFactor {
  describe(): string;
  adjust(item: LenientProofTarget, value: number): number;
}

export class RoundingLenientProofTargetAdjuster implements LenientProofTargetFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientProofTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientProofTargetAdjuster implements LenientProofTargetFactor {
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

  adjust(item: LenientProofTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientProofTargetAdjuster implements LenientProofTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientProofTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLenientProofTargetAdjuster implements LenientProofTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientProofTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientProofTargetAdjuster implements LenientProofTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientProofTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ChannelLenientProofTargetAdjuster implements LenientProofTargetFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LenientProofTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the lenient proof target steps in order and keeps a trace of each. */
export class LenientProofTargetEngine {
  steps: LenientProofTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientProofTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientProofTarget): number {
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

  evaluateAll(items: LenientProofTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientProofTargetEngine(flagsValue: flags.Registry): LenientProofTargetEngine {
  return new LenientProofTargetEngine(
    [
      new RoundingLenientProofTargetAdjuster(5),
      new FlaggedLenientProofTargetAdjuster(flagsValue, "lenient-proof-target-fallback", 10),
      new MinimumLenientProofTargetAdjuster(32.1),
      new TieredLenientProofTargetAdjuster([621, 8777], [0.92, 0.91]),
      new PercentLenientProofTargetAdjuster(11.6),
      new ChannelLenientProofTargetAdjuster(new Map<string, number>([["east", 0.87], ["west", 0.72]])),
    ],
    [],
    4.1,
    31282.3,
  );
}
