import * as numbers from "../../../../kit/numbers.js";
import { RegionalComplaintWindow } from "./regional-complaint-window.js";

/** One step of the regional complaint window calculation. */
export interface RegionalComplaintWindowStep {
  describe(): string;
  adjust(item: RegionalComplaintWindow, value: number): number;
}

export class TieredRegionalComplaintWindowAdjuster implements RegionalComplaintWindowStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalComplaintWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRegionalComplaintWindowAdjuster implements RegionalComplaintWindowStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalComplaintWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalComplaintWindowAdjuster implements RegionalComplaintWindowStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalComplaintWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the regional complaint window steps in order and keeps a trace of each. */
export class RegionalComplaintWindowEngine {
  steps: RegionalComplaintWindowStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalComplaintWindowStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalComplaintWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RegionalComplaintWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalComplaintWindowEngine(): RegionalComplaintWindowEngine {
  return new RegionalComplaintWindowEngine(
    [
      new TieredRegionalComplaintWindowAdjuster([4689, 5401, 5643, 8318], [1.05, 0.9, 0.95, 1.18]),
      new PercentRegionalComplaintWindowAdjuster(15.2),
      new RoundingRegionalComplaintWindowAdjuster(5),
    ],
    [],
    4.9,
    84897.9,
  );
}
