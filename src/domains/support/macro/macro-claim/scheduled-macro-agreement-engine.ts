import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

/** One step of the scheduled macro agreement calculation. */
export interface ScheduledMacroAgreementFactor {
  describe(): string;
  adjust(item: ScheduledMacroAgreement, value: number): number;
}

export class RoundingScheduledMacroAgreementAdjuster implements ScheduledMacroAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledMacroAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelScheduledMacroAgreementAdjuster implements ScheduledMacroAgreementFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ScheduledMacroAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledMacroAgreementAdjuster implements ScheduledMacroAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledMacroAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredScheduledMacroAgreementAdjuster implements ScheduledMacroAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledMacroAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledMacroAgreementWeightOffsetAdjuster implements ScheduledMacroAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ScheduledMacroAgreement, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedScheduledMacroAgreementAdjuster implements ScheduledMacroAgreementFactor {
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

  adjust(item: ScheduledMacroAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled macro agreement steps in order and keeps a trace of each. */
export class ScheduledMacroAgreementEngine {
  steps: ScheduledMacroAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledMacroAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledMacroAgreement): number {
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

  evaluateAll(items: ScheduledMacroAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledMacroAgreementEngine(flagsValue: flags.Registry): ScheduledMacroAgreementEngine {
  return new ScheduledMacroAgreementEngine(
    [
      new RoundingScheduledMacroAgreementAdjuster(5),
      new LabelScheduledMacroAgreementAdjuster(
        new Map<string, number>([["retail", 0.81], ["east", 0.81], ["south", 1.24]]),
      ),
      new MinimumScheduledMacroAgreementAdjuster(46.3),
      new TieredScheduledMacroAgreementAdjuster([509, 3713, 4961, 7004], [0.96, 0.86, 1.12, 0.83]),
      new ScheduledMacroAgreementWeightOffsetAdjuster(0.19),
      new FlaggedScheduledMacroAgreementAdjuster(flagsValue, "scheduled-macro-agreement-regional", -8.5),
    ],
    [],
    1.1,
    20676.1,
  );
}
