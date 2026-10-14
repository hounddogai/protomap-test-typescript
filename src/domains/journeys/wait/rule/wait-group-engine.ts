import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitGroup } from "./wait-group.js";

/** One step of the wait group calculation. */
export interface WaitGroupFactor {
  describe(): string;
  adjust(item: WaitGroup, value: number): number;
}

export class TieredWaitGroupAdjuster implements WaitGroupFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WaitGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentWaitGroupAdjuster implements WaitGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitleWaitGroupAdjuster implements WaitGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WaitGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWaitGroupAdjuster implements WaitGroupFactor {
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

  adjust(item: WaitGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWaitGroupAdjuster implements WaitGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait group steps in order and keeps a trace of each. */
export class WaitGroupEngine {
  steps: WaitGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WaitGroup): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WaitGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWaitGroupEngine(flagsValue: flags.Registry): WaitGroupEngine {
  return new WaitGroupEngine(
    [
      new TieredWaitGroupAdjuster([985, 3237, 7903], [1.03, 0.83, 1.16]),
      new PercentWaitGroupAdjuster(2.2),
      new TitleWaitGroupAdjuster(new Map<string, number>([["retail", 1.38]])),
      new FlaggedWaitGroupAdjuster(flagsValue, "wait-group-global", -6.9),
      new RoundingWaitGroupAdjuster(5),
    ],
    [],
    1.2,
    43780.3,
  );
}
