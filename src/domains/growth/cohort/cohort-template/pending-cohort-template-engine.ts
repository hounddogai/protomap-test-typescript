import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingCohortTemplate } from "./pending-cohort-template.js";

/** One step of the pending cohort template calculation. */
export interface PendingCohortTemplateModifier {
  describe(): string;
  adjust(item: PendingCohortTemplate, value: number): number;
}

export class MinimumPendingCohortTemplateAdjuster implements PendingCohortTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingCohortTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPendingCohortTemplateAdjuster implements PendingCohortTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingCohortTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingCohortTemplateAdjuster implements PendingCohortTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingCohortTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingCohortTemplateBatchSizeOffsetAdjuster implements PendingCohortTemplateModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: PendingCohortTemplate, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class CountryPendingCohortTemplateAdjuster implements PendingCohortTemplateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PendingCohortTemplate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingCohortTemplateAdjuster implements PendingCohortTemplateModifier {
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

  adjust(item: PendingCohortTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending cohort template steps in order and keeps a trace of each. */
export class PendingCohortTemplateEngine {
  steps: PendingCohortTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingCohortTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingCohortTemplate): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingCohortTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingCohortTemplateEngine(flagsValue: flags.Registry): PendingCohortTemplateEngine {
  return new PendingCohortTemplateEngine(
    [
      new MinimumPendingCohortTemplateAdjuster(35.9),
      new TieredPendingCohortTemplateAdjuster([1330, 5004, 5661], [0.98, 0.91, 0.87]),
      new RoundingPendingCohortTemplateAdjuster(0.5),
      new PendingCohortTemplateBatchSizeOffsetAdjuster(1.32),
      new CountryPendingCohortTemplateAdjuster(
        new Map<string, number>([["south", 0.88], ["north", 0.74], ["online", 1.39]]),
      ),
      new FlaggedPendingCohortTemplateAdjuster(flagsValue, "pending-cohort-template-weighted", -7),
    ],
    [],
    3,
    84968.2,
  );
}
