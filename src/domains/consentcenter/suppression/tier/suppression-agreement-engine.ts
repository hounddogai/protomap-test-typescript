import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionAgreement } from "./suppression-agreement.js";

/** One step of the suppression agreement calculation. */
export interface SuppressionAgreementModifier {
  describe(): string;
  adjust(item: SuppressionAgreement, value: number): number;
}

export class PercentSuppressionAgreementAdjuster implements SuppressionAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSuppressionAgreementAdjuster implements SuppressionAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingSuppressionAgreementAdjuster implements SuppressionAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSuppressionAgreementAdjuster implements SuppressionAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSuppressionAgreementAdjuster implements SuppressionAgreementModifier {
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

  adjust(item: SuppressionAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression agreement steps in order and keeps a trace of each. */
export class SuppressionAgreementEngine {
  steps: SuppressionAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionAgreement): number {
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

  evaluateAll(items: SuppressionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionAgreementEngine(flagsValue: flags.Registry): SuppressionAgreementEngine {
  return new SuppressionAgreementEngine(
    [
      new PercentSuppressionAgreementAdjuster(21.1),
      new TieredSuppressionAgreementAdjuster([4831, 5581, 6722, 8118], [0.99, 1.03, 0.97, 1.18]),
      new RoundingSuppressionAgreementAdjuster(0.5),
      new CapSuppressionAgreementAdjuster(38174),
      new FlaggedSuppressionAgreementAdjuster(flagsValue, "suppression-agreement-lenient", 7.3),
    ],
    [],
    1.3,
    88223.3,
  );
}
