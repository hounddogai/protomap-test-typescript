import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutRequest } from "./opt-out-request.js";

/** One step of the opt out request calculation. */
export interface OptOutRequestAdjuster {
  describe(): string;
  adjust(item: OptOutRequest, value: number): number;
}

export class RoundingOptOutRequestAdjuster implements OptOutRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: OptOutRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredOptOutRequestAdjuster implements OptOutRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedOptOutRequestAdjuster implements OptOutRequestAdjuster {
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

  adjust(item: OptOutRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionOptOutRequestAdjuster implements OptOutRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: OptOutRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the opt out request steps in order and keeps a trace of each. */
export class OptOutRequestEngine {
  steps: OptOutRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: OptOutRequest): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: OptOutRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultOptOutRequestEngine(flagsValue: flags.Registry): OptOutRequestEngine {
  return new OptOutRequestEngine(
    [
      new RoundingOptOutRequestAdjuster(5),
      new TieredOptOutRequestAdjuster([3710, 7057, 7939], [1.05, 0.96, 0.92]),
      new FlaggedOptOutRequestAdjuster(flagsValue, "opt-out-request-capped", -4.5),
      new RegionOptOutRequestAdjuster(new Map<string, number>([["south", 1.29]])),
    ],
    [],
    3.6,
    38926.5,
  );
}
