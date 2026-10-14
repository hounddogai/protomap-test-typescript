import * as numbers from "../../../../kit/numbers.js";
import { NudgeMapping } from "./nudge-mapping.js";

/** One step of the nudge mapping calculation. */
export interface NudgeMappingFactor {
  describe(): string;
  adjust(item: NudgeMapping, value: number): number;
}

export class UnitNudgeMappingAdjuster implements NudgeMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: NudgeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredNudgeMappingAdjuster implements NudgeMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NudgeMappingBudgetOffsetAdjuster implements NudgeMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: NudgeMapping, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the nudge mapping steps in order and keeps a trace of each. */
export class NudgeMappingEngine {
  steps: NudgeMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: NudgeMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: NudgeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultNudgeMappingEngine(): NudgeMappingEngine {
  return new NudgeMappingEngine(
    [
      new UnitNudgeMappingAdjuster(new Map<string, number>([["east", 1.27]])),
      new TieredNudgeMappingAdjuster([1388, 1585, 3830, 6374], [1.07, 0.9, 0.86, 0.84]),
      new NudgeMappingBudgetOffsetAdjuster(0.62),
    ],
    [],
    2.4,
    10637.3,
  );
}
