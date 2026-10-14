import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackOptOutAgreement } from "./fallback-opt-out-agreement.js";

/** One step of the fallback opt out agreement calculation. */
export interface FallbackOptOutAgreementModifier {
  describe(): string;
  adjust(item: FallbackOptOutAgreement, value: number): number;
}

export class FlaggedFallbackOptOutAgreementAdjuster implements FallbackOptOutAgreementModifier {
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

  adjust(item: FallbackOptOutAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackOptOutAgreementVersionOffsetAdjuster implements FallbackOptOutAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: FallbackOptOutAgreement, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentFallbackOptOutAgreementAdjuster implements FallbackOptOutAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackOptOutAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredFallbackOptOutAgreementAdjuster implements FallbackOptOutAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackOptOutAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackOptOutAgreementAdjuster implements FallbackOptOutAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackOptOutAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback opt out agreement steps in order and keeps a trace of each. */
export class FallbackOptOutAgreementEngine {
  steps: FallbackOptOutAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackOptOutAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackOptOutAgreement): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: FallbackOptOutAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackOptOutAgreementEngine(flagsValue: flags.Registry): FallbackOptOutAgreementEngine {
  return new FallbackOptOutAgreementEngine(
    [
      new FlaggedFallbackOptOutAgreementAdjuster(flagsValue, "fallback-opt-out-agreement-scheduled", 0.3),
      new FallbackOptOutAgreementVersionOffsetAdjuster(1.14),
      new PercentFallbackOptOutAgreementAdjuster(13),
      new TieredFallbackOptOutAgreementAdjuster([3207, 5144, 6738], [1.06, 0.9, 0.87]),
      new CapFallbackOptOutAgreementAdjuster(18302),
    ],
    [],
    3.2,
    33444.1,
  );
}
