import { GlobalEscalationSummary } from "./global-escalation-summary.js";

/** One step of the global escalation summary calculation. */
export interface GlobalEscalationSummaryAdjuster {
  describe(): string;
  adjust(item: GlobalEscalationSummary, value: number): number;
}

export class GlobalEscalationSummaryCostOffsetAdjuster implements GlobalEscalationSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: GlobalEscalationSummary, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class PercentGlobalEscalationSummaryAdjuster implements GlobalEscalationSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalEscalationSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalEscalationSummaryAdjuster implements GlobalEscalationSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalEscalationSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalEscalationSummaryAdjuster implements GlobalEscalationSummaryAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalEscalationSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionGlobalEscalationSummaryAdjuster implements GlobalEscalationSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: GlobalEscalationSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global escalation summary steps in order and keeps a trace of each. */
export class GlobalEscalationSummaryEngine {
  steps: GlobalEscalationSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalEscalationSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalEscalationSummary): number {
    let current = item.adjustedExposure();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: GlobalEscalationSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalEscalationSummaryEngine(): GlobalEscalationSummaryEngine {
  return new GlobalEscalationSummaryEngine(
    [
      new GlobalEscalationSummaryCostOffsetAdjuster(0.25),
      new PercentGlobalEscalationSummaryAdjuster(-24.8),
      new TieredGlobalEscalationSummaryAdjuster([2185, 5193, 7578], [1.07, 1.09, 0.94]),
      new CapGlobalEscalationSummaryAdjuster(9157),
      new RegionGlobalEscalationSummaryAdjuster(new Map<string, number>([["east", 1.04]])),
    ],
    [],
    1.1,
    75937.6,
  );
}
