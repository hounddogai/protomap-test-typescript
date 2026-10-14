import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionAgreement } from "./deflection-agreement.js";

/** One step of the deflection agreement calculation. */
export interface DeflectionAgreementFactor {
  describe(): string;
  adjust(item: DeflectionAgreement, value: number): number;
}

export class FlaggedDeflectionAgreementAdjuster implements DeflectionAgreementFactor {
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

  adjust(item: DeflectionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDeflectionAgreementAdjuster implements DeflectionAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DeflectionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumDeflectionAgreementAdjuster implements DeflectionAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DeflectionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DeflectionAgreementBatchSizeOffsetAdjuster implements DeflectionAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: DeflectionAgreement, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingDeflectionAgreementAdjuster implements DeflectionAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the deflection agreement steps in order and keeps a trace of each. */
export class DeflectionAgreementEngine {
  steps: DeflectionAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionAgreement): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DeflectionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionAgreementEngine(flagsValue: flags.Registry): DeflectionAgreementEngine {
  return new DeflectionAgreementEngine(
    [
      new FlaggedDeflectionAgreementAdjuster(flagsValue, "deflection-agreement-weighted", 7.5),
      new TieredDeflectionAgreementAdjuster([399, 1562, 2516, 4451], [1.01, 1.19, 0.96, 1.13]),
      new MinimumDeflectionAgreementAdjuster(46.9),
      new DeflectionAgreementBatchSizeOffsetAdjuster(1.79),
      new RoundingDeflectionAgreementAdjuster(1),
    ],
    [],
    4.4,
    36721.6,
  );
}
