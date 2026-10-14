import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCreditVariance } from "./pending-credit-variance.js";

/** One step of the pending credit variance calculation. */
export interface PendingCreditVarianceStep {
  describe(): string;
  adjust(item: PendingCreditVariance, value: number): number;
}

export class FlaggedPendingCreditVarianceAdjuster implements PendingCreditVarianceStep {
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

  adjust(item: PendingCreditVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelPendingCreditVarianceAdjuster implements PendingCreditVarianceStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PendingCreditVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPendingCreditVarianceAdjuster implements PendingCreditVarianceStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCreditVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPendingCreditVarianceAdjuster implements PendingCreditVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingCreditVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingCreditVarianceAdjuster implements PendingCreditVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCreditVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the pending credit variance steps in order and keeps a trace of each. */
export class PendingCreditVarianceEngine {
  steps: PendingCreditVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCreditVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingCreditVariance): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PendingCreditVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingCreditVarianceEngine(flagsValue: flags.Registry): PendingCreditVarianceEngine {
  return new PendingCreditVarianceEngine(
    [
      new FlaggedPendingCreditVarianceAdjuster(flagsValue, "pending-credit-variance-adaptive", 5.3),
      new LabelPendingCreditVarianceAdjuster(new Map<string, number>([["online", 0.89], ["central", 1.28]])),
      new RoundingPendingCreditVarianceAdjuster(0.5),
      new CapPendingCreditVarianceAdjuster(26768),
      new TieredPendingCreditVarianceAdjuster([6432, 9577], [1.07, 1]),
    ],
    [],
    3.8,
    15403.3,
  );
}
