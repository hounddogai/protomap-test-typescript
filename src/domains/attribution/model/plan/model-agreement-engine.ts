import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelAgreement } from "./model-agreement.js";

/** One step of the model agreement calculation. */
export interface ModelAgreementStep {
  describe(): string;
  adjust(item: ModelAgreement, value: number): number;
}

export class PercentModelAgreementAdjuster implements ModelAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ModelAgreementMarginOffsetAdjuster implements ModelAgreementStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ModelAgreement, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedModelAgreementAdjuster implements ModelAgreementStep {
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

  adjust(item: ModelAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredModelAgreementAdjuster implements ModelAgreementStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingModelAgreementAdjuster implements ModelAgreementStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the model agreement steps in order and keeps a trace of each. */
export class ModelAgreementEngine {
  steps: ModelAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ModelAgreement): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ModelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultModelAgreementEngine(flagsValue: flags.Registry): ModelAgreementEngine {
  return new ModelAgreementEngine(
    [
      new PercentModelAgreementAdjuster(6.6),
      new ModelAgreementMarginOffsetAdjuster(0.85),
      new FlaggedModelAgreementAdjuster(flagsValue, "model-agreement-global", -8.5),
      new TieredModelAgreementAdjuster([721, 7221], [0.97, 0.89]),
      new RoundingModelAgreementAdjuster(5),
    ],
    [],
    4,
    71447.1,
  );
}
