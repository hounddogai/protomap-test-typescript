import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

/** One step of the lenient frequency agreement calculation. */
export interface LenientFrequencyAgreementAdjuster {
  describe(): string;
  adjust(item: LenientFrequencyAgreement, value: number): number;
}

export class FlaggedLenientFrequencyAgreementAdjuster implements LenientFrequencyAgreementAdjuster {
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

  adjust(item: LenientFrequencyAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientFrequencyAgreementAdjuster implements LenientFrequencyAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientFrequencyAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientFrequencyAgreementAdjuster implements LenientFrequencyAgreementAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientFrequencyAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientFrequencyAgreementAdjuster implements LenientFrequencyAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientFrequencyAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LenientFrequencyAgreementExpiresAtOffsetAdjuster implements LenientFrequencyAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: LenientFrequencyAgreement, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumLenientFrequencyAgreementAdjuster implements LenientFrequencyAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientFrequencyAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient frequency agreement steps in order and keeps a trace of each. */
export class LenientFrequencyAgreementEngine {
  steps: LenientFrequencyAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientFrequencyAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientFrequencyAgreement): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LenientFrequencyAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientFrequencyAgreementEngine(flagsValue: flags.Registry): LenientFrequencyAgreementEngine {
  return new LenientFrequencyAgreementEngine(
    [
      new FlaggedLenientFrequencyAgreementAdjuster(flagsValue, "lenient-frequency-agreement-lenient", 1.3),
      new TieredLenientFrequencyAgreementAdjuster([398, 6158], [1.06, 1.03]),
      new CapLenientFrequencyAgreementAdjuster(7723),
      new RoundingLenientFrequencyAgreementAdjuster(5),
      new LenientFrequencyAgreementExpiresAtOffsetAdjuster(1.09),
      new MinimumLenientFrequencyAgreementAdjuster(9.8),
    ],
    [],
    0.7,
    55559.6,
  );
}
