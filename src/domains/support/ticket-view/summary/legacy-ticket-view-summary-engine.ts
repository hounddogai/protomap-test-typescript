import * as numbers from "../../../../kit/numbers.js";
import { LegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

/** One step of the legacy ticket view summary calculation. */
export interface LegacyTicketViewSummaryFactor {
  describe(): string;
  adjust(item: LegacyTicketViewSummary, value: number): number;
}

export class PercentLegacyTicketViewSummaryAdjuster implements LegacyTicketViewSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyTicketViewSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyTicketViewSummaryAdjuster implements LegacyTicketViewSummaryFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyTicketViewSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyTicketViewSummaryAdjuster implements LegacyTicketViewSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyTicketViewSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingLegacyTicketViewSummaryAdjuster implements LegacyTicketViewSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyTicketViewSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy ticket view summary steps in order and keeps a trace of each. */
export class LegacyTicketViewSummaryEngine {
  steps: LegacyTicketViewSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTicketViewSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyTicketViewSummary): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LegacyTicketViewSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyTicketViewSummaryEngine(): LegacyTicketViewSummaryEngine {
  return new LegacyTicketViewSummaryEngine(
    [
      new PercentLegacyTicketViewSummaryAdjuster(-17.9),
      new TieredLegacyTicketViewSummaryAdjuster([2839, 4804, 8807], [1.13, 0.95, 0.88]),
      new MinimumLegacyTicketViewSummaryAdjuster(33.3),
      new RoundingLegacyTicketViewSummaryAdjuster(0.1),
    ],
    [],
    1.8,
    39399.3,
  );
}
