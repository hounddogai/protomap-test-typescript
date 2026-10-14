import * as flags from "../../../../kit/flags.js";
import { CohortManifest } from "./cohort-manifest.js";

/** One step of the cohort manifest calculation. */
export interface CohortManifestModifier {
  describe(): string;
  adjust(item: CohortManifest, value: number): number;
}

export class CohortManifestCostOffsetAdjuster implements CohortManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: CohortManifest, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class FlaggedCohortManifestAdjuster implements CohortManifestModifier {
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

  adjust(item: CohortManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCohortManifestAdjuster implements CohortManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredCohortManifestAdjuster implements CohortManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the cohort manifest steps in order and keeps a trace of each. */
export class CohortManifestEngine {
  steps: CohortManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CohortManifest): number {
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

  evaluateAll(items: CohortManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCohortManifestEngine(flagsValue: flags.Registry): CohortManifestEngine {
  return new CohortManifestEngine(
    [
      new CohortManifestCostOffsetAdjuster(0.15),
      new FlaggedCohortManifestAdjuster(flagsValue, "cohort-manifest-scheduled", -7.9),
      new CapCohortManifestAdjuster(17806),
      new TieredCohortManifestAdjuster([3203, 5003, 5585], [1.1, 0.92, 0.92]),
    ],
    [],
    2.4,
    45023.7,
  );
}
