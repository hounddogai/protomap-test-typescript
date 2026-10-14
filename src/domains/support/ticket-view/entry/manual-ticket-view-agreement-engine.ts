import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewAgreement } from "./manual-ticket-view-agreement.js";

/** One step of the manual ticket view agreement calculation. */
export interface ManualTicketViewAgreementAdjuster {
  describe(): string;
  adjust(item: ManualTicketViewAgreement, value: number): number;
}

export class PercentManualTicketViewAgreementAdjuster implements ManualTicketViewAgreementAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTicketViewAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualTicketViewAgreementAdjuster implements ManualTicketViewAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTicketViewAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ManualTicketViewAgreementRateOffsetAdjuster implements ManualTicketViewAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: ManualTicketViewAgreement, value: number): number {
    return value + item.rate * this.weight;
  }
}

/** Runs the manual ticket view agreement steps in order and keeps a trace of each. */
export class ManualTicketViewAgreementEngine {
  steps: ManualTicketViewAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualTicketViewAgreement): number {
    let current = item.netExposure();
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

  evaluateAll(items: ManualTicketViewAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualTicketViewAgreementEngine(): ManualTicketViewAgreementEngine {
  return new ManualTicketViewAgreementEngine(
    [
      new PercentManualTicketViewAgreementAdjuster(12),
      new TieredManualTicketViewAgreementAdjuster([2315, 7012, 7496, 8203], [0.9, 1.14, 1.2, 1.19]),
      new ManualTicketViewAgreementRateOffsetAdjuster(0.65),
    ],
    [],
    2.4,
    15288.7,
  );
}
