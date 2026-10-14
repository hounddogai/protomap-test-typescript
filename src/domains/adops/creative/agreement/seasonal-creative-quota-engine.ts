import { SeasonalCreativeQuota } from "./seasonal-creative-quota.js";

/** One step of the seasonal creative quota calculation. */
export interface SeasonalCreativeQuotaStep {
  describe(): string;
  adjust(item: SeasonalCreativeQuota, value: number): number;
}

export class PercentSeasonalCreativeQuotaAdjuster implements SeasonalCreativeQuotaStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalCreativeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelSeasonalCreativeQuotaAdjuster implements SeasonalCreativeQuotaStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SeasonalCreativeQuota, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredSeasonalCreativeQuotaAdjuster implements SeasonalCreativeQuotaStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalCreativeQuota, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the seasonal creative quota steps in order and keeps a trace of each. */
export class SeasonalCreativeQuotaEngine {
  steps: SeasonalCreativeQuotaStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCreativeQuotaStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalCreativeQuota): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SeasonalCreativeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalCreativeQuotaEngine(): SeasonalCreativeQuotaEngine {
  return new SeasonalCreativeQuotaEngine(
    [
      new PercentSeasonalCreativeQuotaAdjuster(22.4),
      new LabelSeasonalCreativeQuotaAdjuster(new Map<string, number>([["central", 0.92]])),
      new TieredSeasonalCreativeQuotaAdjuster([461, 1305, 6467], [0.84, 0.88, 1.02]),
    ],
    [],
    4.7,
    8050.8,
  );
}
