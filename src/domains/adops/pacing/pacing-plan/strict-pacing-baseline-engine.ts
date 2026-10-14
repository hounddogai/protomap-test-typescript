import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictPacingBaseline } from "./strict-pacing-baseline.js";

/** One step of the strict pacing baseline calculation. */
export interface StrictPacingBaselineModifier {
  describe(): string;
  adjust(item: StrictPacingBaseline, value: number): number;
}

export class RoundingStrictPacingBaselineAdjuster implements StrictPacingBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictPacingBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelStrictPacingBaselineAdjuster implements StrictPacingBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: StrictPacingBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class StrictPacingBaselineBudgetOffsetAdjuster implements StrictPacingBaselineModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: StrictPacingBaseline, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedStrictPacingBaselineAdjuster implements StrictPacingBaselineModifier {
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

  adjust(item: StrictPacingBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictPacingBaselineAdjuster implements StrictPacingBaselineModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictPacingBaseline, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the strict pacing baseline steps in order and keeps a trace of each. */
export class StrictPacingBaselineEngine {
  steps: StrictPacingBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictPacingBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictPacingBaseline): number {
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

  evaluateAll(items: StrictPacingBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictPacingBaselineEngine(flagsValue: flags.Registry): StrictPacingBaselineEngine {
  return new StrictPacingBaselineEngine(
    [
      new RoundingStrictPacingBaselineAdjuster(0.1),
      new ChannelStrictPacingBaselineAdjuster(new Map<string, number>([["retail", 1.1], ["online", 1.37]])),
      new StrictPacingBaselineBudgetOffsetAdjuster(1.65),
      new FlaggedStrictPacingBaselineAdjuster(flagsValue, "strict-pacing-baseline-lenient", -2.2),
      new TieredStrictPacingBaselineAdjuster([6592, 8528], [1.05, 1.06]),
    ],
    [],
    4.8,
    3832,
  );
}
