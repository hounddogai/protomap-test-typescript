import * as numbers from "../../../../kit/numbers.js";
import { EscalationWindow } from "./escalation-window.js";

/** One step of the escalation window calculation. */
export interface EscalationWindowFactor {
  describe(): string;
  adjust(item: EscalationWindow, value: number): number;
}

export class EscalationWindowBidOffsetAdjuster implements EscalationWindowFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: EscalationWindow, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class TieredEscalationWindowAdjuster implements EscalationWindowFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: EscalationWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingEscalationWindowAdjuster implements EscalationWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the escalation window steps in order and keeps a trace of each. */
export class EscalationWindowEngine {
  steps: EscalationWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: EscalationWindow): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: EscalationWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultEscalationWindowEngine(): EscalationWindowEngine {
  return new EscalationWindowEngine(
    [
      new EscalationWindowBidOffsetAdjuster(0.65),
      new TieredEscalationWindowAdjuster([3131, 6898], [0.86, 1.13]),
      new RoundingEscalationWindowAdjuster(5),
    ],
    [],
    3.6,
    19436.1,
  );
}
