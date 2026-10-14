import * as numbers from "../../../../kit/numbers.js";
import { RollingRewardRuleLedger } from "./rolling-reward-rule-ledger.js";

/** One step of the rolling reward rule ledger calculation. */
export interface RollingRewardRuleLedgerStep {
  describe(): string;
  adjust(item: RollingRewardRuleLedger, value: number): number;
}

export class PercentRollingRewardRuleLedgerAdjuster implements RollingRewardRuleLedgerStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingRewardRuleLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingRewardRuleLedgerAdjuster implements RollingRewardRuleLedgerStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingRewardRuleLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingRewardRuleLedgerAdjuster implements RollingRewardRuleLedgerStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRewardRuleLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling reward rule ledger steps in order and keeps a trace of each. */
export class RollingRewardRuleLedgerEngine {
  steps: RollingRewardRuleLedgerStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRewardRuleLedgerStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingRewardRuleLedger): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: RollingRewardRuleLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingRewardRuleLedgerEngine(): RollingRewardRuleLedgerEngine {
  return new RollingRewardRuleLedgerEngine(
    [
      new PercentRollingRewardRuleLedgerAdjuster(-16.1),
      new RoundingRollingRewardRuleLedgerAdjuster(0.5),
      new TieredRollingRewardRuleLedgerAdjuster([66, 1014, 2838, 5709], [1.18, 1, 0.88, 1.07]),
    ],
    [],
    0.1,
    23204.5,
  );
}
