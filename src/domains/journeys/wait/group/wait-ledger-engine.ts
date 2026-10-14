import * as numbers from "../../../../kit/numbers.js";
import { WaitLedger } from "./wait-ledger.js";

/** One step of the wait ledger calculation. */
export interface WaitLedgerFactor {
  describe(): string;
  adjust(item: WaitLedger, value: number): number;
}

export class PercentWaitLedgerAdjuster implements WaitLedgerFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitLedger, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class WaitLedgerWindowDaysOffsetAdjuster implements WaitLedgerFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: WaitLedger, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingWaitLedgerAdjuster implements WaitLedgerFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitLedger, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the wait ledger steps in order and keeps a trace of each. */
export class WaitLedgerEngine {
  steps: WaitLedgerFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitLedgerFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitLedger): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: WaitLedger[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitLedgerEngine(): WaitLedgerEngine {
  return new WaitLedgerEngine(
    [
      new PercentWaitLedgerAdjuster(-8.1),
      new WaitLedgerWindowDaysOffsetAdjuster(1.05),
      new RoundingWaitLedgerAdjuster(0.5),
    ],
    [],
    2.7,
    29253,
  );
}
