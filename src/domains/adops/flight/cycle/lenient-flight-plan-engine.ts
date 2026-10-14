import * as numbers from "../../../../kit/numbers.js";
import { LenientFlightPlan } from "./lenient-flight-plan.js";

/** One step of the lenient flight plan calculation. */
export interface LenientFlightPlanAdjuster {
  describe(): string;
  adjust(item: LenientFlightPlan, value: number): number;
}

export class NameLenientFlightPlanAdjuster implements LenientFlightPlanAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientFlightPlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class LenientFlightPlanStartsAtOffsetAdjuster implements LenientFlightPlanAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: LenientFlightPlan, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class RoundingLenientFlightPlanAdjuster implements LenientFlightPlanAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientFlightPlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLenientFlightPlanAdjuster implements LenientFlightPlanAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientFlightPlan, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentLenientFlightPlanAdjuster implements LenientFlightPlanAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientFlightPlan, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient flight plan steps in order and keeps a trace of each. */
export class LenientFlightPlanEngine {
  steps: LenientFlightPlanAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFlightPlanAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LenientFlightPlan): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: LenientFlightPlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLenientFlightPlanEngine(): LenientFlightPlanEngine {
  return new LenientFlightPlanEngine(
    [
      new NameLenientFlightPlanAdjuster(
        new Map<string, number>([["east", 0.85], ["north", 1.13], ["central", 0.73]]),
      ),
      new LenientFlightPlanStartsAtOffsetAdjuster(0.6),
      new RoundingLenientFlightPlanAdjuster(0.5),
      new TieredLenientFlightPlanAdjuster([974, 8451, 8944, 9678], [1.09, 1, 0.89, 1.15]),
      new PercentLenientFlightPlanAdjuster(1.9),
    ],
    [],
    3.6,
    4894,
  );
}
