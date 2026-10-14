import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalApprovalManifest } from "./seasonal-approval-manifest.js";

/** One step of the seasonal approval manifest calculation. */
export interface SeasonalApprovalManifestFactor {
  describe(): string;
  adjust(item: SeasonalApprovalManifest, value: number): number;
}

export class PercentSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalApprovalManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalApprovalManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalApprovalManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalApprovalManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
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

  adjust(item: SeasonalApprovalManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalApprovalManifestAdjuster implements SeasonalApprovalManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalApprovalManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal approval manifest steps in order and keeps a trace of each. */
export class SeasonalApprovalManifestEngine {
  steps: SeasonalApprovalManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalApprovalManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalApprovalManifest): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SeasonalApprovalManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalApprovalManifestEngine(flagsValue: flags.Registry): SeasonalApprovalManifestEngine {
  return new SeasonalApprovalManifestEngine(
    [
      new PercentSeasonalApprovalManifestAdjuster(7.3),
      new NameSeasonalApprovalManifestAdjuster(new Map<string, number>([["central", 0.74]])),
      new RoundingSeasonalApprovalManifestAdjuster(0.5),
      new TieredSeasonalApprovalManifestAdjuster([938, 1230], [0.87, 0.94]),
      new FlaggedSeasonalApprovalManifestAdjuster(flagsValue, "seasonal-approval-manifest-legacy", -3.7),
      new MinimumSeasonalApprovalManifestAdjuster(39.9),
    ],
    [],
    2.1,
    9403.8,
  );
}
