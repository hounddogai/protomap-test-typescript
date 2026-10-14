import * as numbers from "../../../../kit/numbers.js";
import { TicketViewTier } from "./ticket-view-tier.js";

/** One step of the ticket view tier calculation. */
export interface TicketViewTierModifier {
  describe(): string;
  adjust(item: TicketViewTier, value: number): number;
}

export class RoundingTicketViewTierAdjuster implements TicketViewTierModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TicketViewTier, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CategoryTicketViewTierAdjuster implements TicketViewTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: TicketViewTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTicketViewTierAdjuster implements TicketViewTierModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentTicketViewTierAdjuster implements TicketViewTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the ticket view tier steps in order and keeps a trace of each. */
export class TicketViewTierEngine {
  steps: TicketViewTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewTier): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: TicketViewTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewTierEngine(): TicketViewTierEngine {
  return new TicketViewTierEngine(
    [
      new RoundingTicketViewTierAdjuster(0.05),
      new CategoryTicketViewTierAdjuster(new Map<string, number>([["west", 0.86]])),
      new MinimumTicketViewTierAdjuster(31.2),
      new PercentTicketViewTierAdjuster(-24.1),
    ],
    [],
    4.3,
    13500.1,
  );
}
