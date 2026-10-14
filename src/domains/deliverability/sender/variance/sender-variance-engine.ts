import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderVariance } from "./sender-variance.js";

/** One step of the sender variance calculation. */
export interface SenderVarianceFactor {
  describe(): string;
  adjust(item: SenderVariance, value: number): number;
}

export class SenderVarianceCeilingOffsetAdjuster implements SenderVarianceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: SenderVariance, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingSenderVarianceAdjuster implements SenderVarianceFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSenderVarianceAdjuster implements SenderVarianceFactor {
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

  adjust(item: SenderVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelSenderVarianceAdjuster implements SenderVarianceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SenderVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSenderVarianceAdjuster implements SenderVarianceFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SenderVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSenderVarianceAdjuster implements SenderVarianceFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sender variance steps in order and keeps a trace of each. */
export class SenderVarianceEngine {
  steps: SenderVarianceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderVarianceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderVariance): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SenderVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderVarianceEngine(flagsValue: flags.Registry): SenderVarianceEngine {
  return new SenderVarianceEngine(
    [
      new SenderVarianceCeilingOffsetAdjuster(1.63),
      new RoundingSenderVarianceAdjuster(5),
      new FlaggedSenderVarianceAdjuster(flagsValue, "sender-variance-seasonal", 8.4),
      new ChannelSenderVarianceAdjuster(new Map<string, number>([["central", 1.2]])),
      new TieredSenderVarianceAdjuster([1183, 3631, 3656, 3768], [0.98, 1.13, 0.95, 1.19]),
      new CapSenderVarianceAdjuster(21485),
    ],
    [],
    1.4,
    25660.9,
  );
}
