import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationCycle } from "./reputation-cycle.js";

/** One step of the reputation cycle calculation. */
export interface ReputationCycleModifier {
  describe(): string;
  adjust(item: ReputationCycle, value: number): number;
}

export class RoundingReputationCycleAdjuster implements ReputationCycleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedReputationCycleAdjuster implements ReputationCycleModifier {
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

  adjust(item: ReputationCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentReputationCycleAdjuster implements ReputationCycleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReputationCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredReputationCycleAdjuster implements ReputationCycleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReputationCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleReputationCycleAdjuster implements ReputationCycleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ReputationCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumReputationCycleAdjuster implements ReputationCycleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reputation cycle steps in order and keeps a trace of each. */
export class ReputationCycleEngine {
  steps: ReputationCycleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationCycleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReputationCycle): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ReputationCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReputationCycleEngine(flagsValue: flags.Registry): ReputationCycleEngine {
  return new ReputationCycleEngine(
    [
      new RoundingReputationCycleAdjuster(0.25),
      new FlaggedReputationCycleAdjuster(flagsValue, "reputation-cycle-weighted", -5.4),
      new PercentReputationCycleAdjuster(13.6),
      new TieredReputationCycleAdjuster([509, 2424, 5029], [0.8, 0.84, 1.15]),
      new TitleReputationCycleAdjuster(new Map<string, number>([["east", 1.37]])),
      new MinimumReputationCycleAdjuster(35.9),
    ],
    [],
    0.7,
    45250.8,
  );
}
