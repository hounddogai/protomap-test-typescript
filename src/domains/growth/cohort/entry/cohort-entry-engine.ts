import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortEntry } from "./cohort-entry.js";

/** One step of the cohort entry calculation. */
export interface CohortEntryStep {
  describe(): string;
  adjust(item: CohortEntry, value: number): number;
}

export class FlaggedCohortEntryAdjuster implements CohortEntryStep {
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

  adjust(item: CohortEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelCohortEntryAdjuster implements CohortEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CohortEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentCohortEntryAdjuster implements CohortEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingCohortEntryAdjuster implements CohortEntryStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortEntry, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredCohortEntryAdjuster implements CohortEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CohortEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the cohort entry steps in order and keeps a trace of each. */
export class CohortEntryEngine {
  steps: CohortEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortEntry): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CohortEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortEntryEngine(flagsValue: flags.Registry): CohortEntryEngine {
  return new CohortEntryEngine(
    [
      new FlaggedCohortEntryAdjuster(flagsValue, "cohort-entry-scheduled", 1.1),
      new LabelCohortEntryAdjuster(new Map<string, number>([["east", 1.02], ["online", 0.97]])),
      new PercentCohortEntryAdjuster(-21.7),
      new RoundingCohortEntryAdjuster(1),
      new TieredCohortEntryAdjuster([1736, 2787], [1.11, 1.04]),
    ],
    [],
    1.8,
    69224.2,
  );
}
