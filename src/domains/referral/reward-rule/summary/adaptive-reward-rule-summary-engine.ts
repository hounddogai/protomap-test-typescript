import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

/** One step of the adaptive reward rule summary calculation. */
export interface AdaptiveRewardRuleSummaryAdjuster {
  describe(): string;
  adjust(item: AdaptiveRewardRuleSummary, value: number): number;
}

export class NameAdaptiveRewardRuleSummaryAdjuster implements AdaptiveRewardRuleSummaryAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveRewardRuleSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredAdaptiveRewardRuleSummaryAdjuster implements AdaptiveRewardRuleSummaryAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveRewardRuleSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingAdaptiveRewardRuleSummaryAdjuster implements AdaptiveRewardRuleSummaryAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveRewardRuleSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveRewardRuleSummaryAdjuster implements AdaptiveRewardRuleSummaryAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveRewardRuleSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class AdaptiveRewardRuleSummaryMaximumOffsetAdjuster implements AdaptiveRewardRuleSummaryAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: AdaptiveRewardRuleSummary, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the adaptive reward rule summary steps in order and keeps a trace of each. */
export class AdaptiveRewardRuleSummaryEngine {
  steps: AdaptiveRewardRuleSummaryAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveRewardRuleSummaryAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveRewardRuleSummary): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveRewardRuleSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveRewardRuleSummaryEngine(): AdaptiveRewardRuleSummaryEngine {
  return new AdaptiveRewardRuleSummaryEngine(
    [
      new NameAdaptiveRewardRuleSummaryAdjuster(new Map<string, number>([["west", 1.28]])),
      new TieredAdaptiveRewardRuleSummaryAdjuster([11, 206], [1.07, 0.98]),
      new RoundingAdaptiveRewardRuleSummaryAdjuster(5),
      new PercentAdaptiveRewardRuleSummaryAdjuster(22.3),
      new AdaptiveRewardRuleSummaryMaximumOffsetAdjuster(0.97),
    ],
    [],
    2.6,
    28223.1,
  );
}
