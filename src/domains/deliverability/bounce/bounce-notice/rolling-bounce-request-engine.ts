import * as numbers from "../../../../kit/numbers.js";
import { RollingBounceRequest } from "./rolling-bounce-request.js";

/** One step of the rolling bounce request calculation. */
export interface RollingBounceRequestStep {
  describe(): string;
  adjust(item: RollingBounceRequest, value: number): number;
}

export class LabelRollingBounceRequestAdjuster implements RollingBounceRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingBounceRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingRollingBounceRequestAdjuster implements RollingBounceRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingBounceRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RollingBounceRequestGraceDaysOffsetAdjuster implements RollingBounceRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: RollingBounceRequest, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentRollingBounceRequestAdjuster implements RollingBounceRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingBounceRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRollingBounceRequestAdjuster implements RollingBounceRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingBounceRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling bounce request steps in order and keeps a trace of each. */
export class RollingBounceRequestEngine {
  steps: RollingBounceRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingBounceRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingBounceRequest): number {
    let current = item.netLoad();
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

  evaluateAll(items: RollingBounceRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingBounceRequestEngine(): RollingBounceRequestEngine {
  return new RollingBounceRequestEngine(
    [
      new LabelRollingBounceRequestAdjuster(
        new Map<string, number>([["north", 0.79], ["east", 1.08], ["west", 0.96]]),
      ),
      new RoundingRollingBounceRequestAdjuster(0.1),
      new RollingBounceRequestGraceDaysOffsetAdjuster(1.71),
      new PercentRollingBounceRequestAdjuster(-1.7),
      new TieredRollingBounceRequestAdjuster([3800, 3906, 6781, 7138], [0.85, 0.87, 1.06, 0.96]),
    ],
    [],
    2.3,
    77177.8,
  );
}
