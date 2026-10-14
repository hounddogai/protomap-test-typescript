import * as numbers from "../../../../kit/numbers.js";
import { CreativeEstimate } from "./creative-estimate.js";

/** One step of the creative estimate calculation. */
export interface CreativeEstimateStep {
  describe(): string;
  adjust(item: CreativeEstimate, value: number): number;
}

export class CreativeEstimateRetriesOffsetAdjuster implements CreativeEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: CreativeEstimate, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class PercentCreativeEstimateAdjuster implements CreativeEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreativeEstimateAdjuster implements CreativeEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeEstimateAdjuster implements CreativeEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelCreativeEstimateAdjuster implements CreativeEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CreativeEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the creative estimate steps in order and keeps a trace of each. */
export class CreativeEstimateEngine {
  steps: CreativeEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CreativeEstimate): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: CreativeEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCreativeEstimateEngine(): CreativeEstimateEngine {
  return new CreativeEstimateEngine(
    [
      new CreativeEstimateRetriesOffsetAdjuster(1.27),
      new PercentCreativeEstimateAdjuster(3.1),
      new TieredCreativeEstimateAdjuster([1127, 3954, 4077], [0.95, 1, 1.17]),
      new RoundingCreativeEstimateAdjuster(0.5),
      new ChannelCreativeEstimateAdjuster(new Map<string, number>([["north", 0.81], ["west", 0.94]])),
    ],
    [],
    4.9,
    75195.1,
  );
}
