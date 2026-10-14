import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

/** One step of the weighted opt out agreement calculation. */
export interface WeightedOptOutAgreementFactor {
  describe(): string;
  adjust(item: WeightedOptOutAgreement, value: number): number;
}

export class FlaggedWeightedOptOutAgreementAdjuster implements WeightedOptOutAgreementFactor {
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

  adjust(item: WeightedOptOutAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedOptOutAgreementAdjuster implements WeightedOptOutAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedOptOutAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class WeightedOptOutAgreementScoreOffsetAdjuster implements WeightedOptOutAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: WeightedOptOutAgreement, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapWeightedOptOutAgreementAdjuster implements WeightedOptOutAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedOptOutAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the weighted opt out agreement steps in order and keeps a trace of each. */
export class WeightedOptOutAgreementEngine {
  steps: WeightedOptOutAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedOptOutAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedOptOutAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedOptOutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedOptOutAgreementEngine(flagsValue: flags.Registry): WeightedOptOutAgreementEngine {
  return new WeightedOptOutAgreementEngine(
    [
      new FlaggedWeightedOptOutAgreementAdjuster(flagsValue, "weighted-opt-out-agreement-adaptive", -9.8),
      new RoundingWeightedOptOutAgreementAdjuster(0.5),
      new WeightedOptOutAgreementScoreOffsetAdjuster(1.35),
      new CapWeightedOptOutAgreementAdjuster(12469),
    ],
    [],
    0.8,
    73249.7,
  );
}
