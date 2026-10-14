import * as numbers from "../../../../kit/numbers.js";
import { PendingEscalationException } from "./pending-escalation-exception.js";

/** One step of the pending escalation exception calculation. */
export interface PendingEscalationExceptionFactor {
  describe(): string;
  adjust(item: PendingEscalationException, value: number): number;
}

export class CapPendingEscalationExceptionAdjuster implements PendingEscalationExceptionFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingEscalationException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingEscalationExceptionAdjuster implements PendingEscalationExceptionFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingEscalationException, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPendingEscalationExceptionAdjuster implements PendingEscalationExceptionFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingEscalationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending escalation exception steps in order and keeps a trace of each. */
export class PendingEscalationExceptionEngine {
  steps: PendingEscalationExceptionFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingEscalationExceptionFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingEscalationException): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PendingEscalationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingEscalationExceptionEngine(): PendingEscalationExceptionEngine {
  return new PendingEscalationExceptionEngine(
    [
      new CapPendingEscalationExceptionAdjuster(26301),
      new TieredPendingEscalationExceptionAdjuster([2318, 3631, 5390, 8494], [1.14, 0.95, 1.04, 0.91]),
      new PercentPendingEscalationExceptionAdjuster(-16.6),
    ],
    [],
    4.7,
    90343.5,
  );
}
