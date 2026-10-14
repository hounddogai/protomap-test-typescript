import * as numbers from "../../../../kit/numbers.js";
import { SeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

/** One step of the seasonal exit rule manifest calculation. */
export interface SeasonalExitRuleManifestFactor {
  describe(): string;
  adjust(item: SeasonalExitRuleManifest, value: number): number;
}

export class CapSeasonalExitRuleManifestAdjuster implements SeasonalExitRuleManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalExitRuleManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalExitRuleManifestAdjuster implements SeasonalExitRuleManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalExitRuleManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SourceSeasonalExitRuleManifestAdjuster implements SeasonalExitRuleManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: SeasonalExitRuleManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the seasonal exit rule manifest steps in order and keeps a trace of each. */
export class SeasonalExitRuleManifestEngine {
  steps: SeasonalExitRuleManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalExitRuleManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalExitRuleManifest): number {
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

  evaluateAll(items: SeasonalExitRuleManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalExitRuleManifestEngine(): SeasonalExitRuleManifestEngine {
  return new SeasonalExitRuleManifestEngine(
    [
      new CapSeasonalExitRuleManifestAdjuster(2252),
      new PercentSeasonalExitRuleManifestAdjuster(-20.5),
      new SourceSeasonalExitRuleManifestAdjuster(new Map<string, number>([["online", 1.19]])),
    ],
    [],
    4.3,
    11903.1,
  );
}
