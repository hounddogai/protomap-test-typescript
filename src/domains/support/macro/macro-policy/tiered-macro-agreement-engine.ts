import * as numbers from "../../../../kit/numbers.js";
import { TieredMacroAgreement } from "./tiered-macro-agreement.js";

/** One step of the tiered macro agreement calculation. */
export interface TieredMacroAgreementModifier {
  describe(): string;
  adjust(item: TieredMacroAgreement, value: number): number;
}

export class TieredTieredMacroAgreementAdjuster implements TieredMacroAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredMacroAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingTieredMacroAgreementAdjuster implements TieredMacroAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredMacroAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentTieredMacroAgreementAdjuster implements TieredMacroAgreementModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredMacroAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered macro agreement steps in order and keeps a trace of each. */
export class TieredMacroAgreementEngine {
  steps: TieredMacroAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredMacroAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredMacroAgreement): number {
    let current = item.netTotal();
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

  evaluateAll(items: TieredMacroAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredMacroAgreementEngine(): TieredMacroAgreementEngine {
  return new TieredMacroAgreementEngine(
    [
      new TieredTieredMacroAgreementAdjuster([1439, 1815], [1.18, 0.89]),
      new RoundingTieredMacroAgreementAdjuster(0.5),
      new PercentTieredMacroAgreementAdjuster(3),
    ],
    [],
    3.3,
    7949,
  );
}
