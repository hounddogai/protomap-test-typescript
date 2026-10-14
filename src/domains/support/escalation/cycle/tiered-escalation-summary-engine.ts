import * as numbers from "../../../../kit/numbers.js";
import { TieredEscalationSummary } from "./tiered-escalation-summary.js";

/** One step of the tiered escalation summary calculation. */
export interface TieredEscalationSummaryFactor {
  describe(): string;
  adjust(item: TieredEscalationSummary, value: number): number;
}

export class TieredTieredEscalationSummaryAdjuster implements TieredEscalationSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredEscalationSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredEscalationSummaryAdjuster implements TieredEscalationSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredEscalationSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelTieredEscalationSummaryAdjuster implements TieredEscalationSummaryFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TieredEscalationSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTieredEscalationSummaryAdjuster implements TieredEscalationSummaryFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredEscalationSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the tiered escalation summary steps in order and keeps a trace of each. */
export class TieredEscalationSummaryEngine {
  steps: TieredEscalationSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEscalationSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TieredEscalationSummary): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: TieredEscalationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTieredEscalationSummaryEngine(): TieredEscalationSummaryEngine {
  return new TieredEscalationSummaryEngine(
    [
      new TieredTieredEscalationSummaryAdjuster([2855, 6472, 9970], [1.02, 1.18, 1.06]),
      new RoundingTieredEscalationSummaryAdjuster(0.05),
      new LabelTieredEscalationSummaryAdjuster(new Map<string, number>([["online", 0.72], ["south", 1.1]])),
      new CapTieredEscalationSummaryAdjuster(23328),
    ],
    [],
    4.5,
    60454.8,
  );
}
