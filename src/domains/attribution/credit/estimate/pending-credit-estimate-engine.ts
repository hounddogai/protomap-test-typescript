import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCreditEstimate } from "./pending-credit-estimate.js";

/** One step of the pending credit estimate calculation. */
export interface PendingCreditEstimateModifier {
  describe(): string;
  adjust(item: PendingCreditEstimate, value: number): number;
}

export class TieredPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCreditEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingCreditEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCreditEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingCreditEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
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

  adjust(item: PendingCreditEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPendingCreditEstimateAdjuster implements PendingCreditEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCreditEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending credit estimate steps in order and keeps a trace of each. */
export class PendingCreditEstimateEngine {
  steps: PendingCreditEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCreditEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingCreditEstimate): number {
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

  evaluateAll(items: PendingCreditEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingCreditEstimateEngine(flagsValue: flags.Registry): PendingCreditEstimateEngine {
  return new PendingCreditEstimateEngine(
    [
      new TieredPendingCreditEstimateAdjuster([2357, 7325, 7811], [0.87, 0.88, 0.89]),
      new ChannelPendingCreditEstimateAdjuster(new Map<string, number>([["west", 1.01]])),
      new RoundingPendingCreditEstimateAdjuster(0.25),
      new PercentPendingCreditEstimateAdjuster(19.4),
      new FlaggedPendingCreditEstimateAdjuster(flagsValue, "pending-credit-estimate-global", -2.5),
      new MinimumPendingCreditEstimateAdjuster(41.7),
    ],
    [],
    3.6,
    91804.4,
  );
}
