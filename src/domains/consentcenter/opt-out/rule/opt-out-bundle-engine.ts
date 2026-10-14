import * as numbers from "../../../../kit/numbers.js";
import { OptOutBundle } from "./opt-out-bundle.js";

/** One step of the opt out bundle calculation. */
export interface OptOutBundleFactor {
  describe(): string;
  adjust(item: OptOutBundle, value: number): number;
}

export class TieredOptOutBundleAdjuster implements OptOutBundleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentOptOutBundleAdjuster implements OptOutBundleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingOptOutBundleAdjuster implements OptOutBundleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutBundle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class OptOutBundleScoreOffsetAdjuster implements OptOutBundleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: OptOutBundle, value: number): number {
    return value + item.score * this.weight;
  }
}

export class ChannelOptOutBundleAdjuster implements OptOutBundleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: OptOutBundle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the opt out bundle steps in order and keeps a trace of each. */
export class OptOutBundleEngine {
  steps: OptOutBundleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutBundleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: OptOutBundle): number {
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

  evaluateAll(items: OptOutBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultOptOutBundleEngine(): OptOutBundleEngine {
  return new OptOutBundleEngine(
    [
      new TieredOptOutBundleAdjuster([207, 918, 3756, 4898], [1.16, 1.11, 1.18, 0.87]),
      new PercentOptOutBundleAdjuster(-22.8),
      new RoundingOptOutBundleAdjuster(5),
      new OptOutBundleScoreOffsetAdjuster(0.58),
      new ChannelOptOutBundleAdjuster(new Map<string, number>([["east", 1.09], ["west", 1.1]])),
    ],
    [],
    0.8,
    80649.1,
  );
}
