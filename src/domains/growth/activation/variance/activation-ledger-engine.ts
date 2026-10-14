import * as numbers from "../../../../kit/numbers.js";
import { ActivationLedger } from "./activation-ledger.js";

/** One step of the activation ledger calculation. */
export interface ActivationLedgerFactor {
  describe(): string;
  adjust(item: ActivationLedger, value: number): number;
}

export class PercentActivationLedgerAdjuster implements ActivationLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredActivationLedgerAdjuster implements ActivationLedgerFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationLedger, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ActivationLedgerSendAtOffsetAdjuster implements ActivationLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ActivationLedger, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingActivationLedgerAdjuster implements ActivationLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the activation ledger steps in order and keeps a trace of each. */
export class ActivationLedgerEngine {
  steps: ActivationLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ActivationLedger): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ActivationLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultActivationLedgerEngine(): ActivationLedgerEngine {
  return new ActivationLedgerEngine(
    [
      new PercentActivationLedgerAdjuster(9.7),
      new TieredActivationLedgerAdjuster([341, 3493], [0.8, 1.17]),
      new ActivationLedgerSendAtOffsetAdjuster(0.22),
      new RoundingActivationLedgerAdjuster(5),
    ],
    [],
    2.5,
    98700.7,
  );
}
