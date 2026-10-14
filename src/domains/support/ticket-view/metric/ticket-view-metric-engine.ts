import { TicketViewMetric } from "./ticket-view-metric.js";

/** One step of the ticket view metric calculation. */
export interface TicketViewMetricAdjuster {
  describe(): string;
  adjust(item: TicketViewMetric, value: number): number;
}

export class TitleTicketViewMetricAdjuster implements TicketViewMetricAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: TicketViewMetric, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapTicketViewMetricAdjuster implements TicketViewMetricAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TicketViewMetric, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTicketViewMetricAdjuster implements TicketViewMetricAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewMetric, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the ticket view metric steps in order and keeps a trace of each. */
export class TicketViewMetricEngine {
  steps: TicketViewMetricAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewMetricAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewMetric): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: TicketViewMetric[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewMetricEngine(): TicketViewMetricEngine {
  return new TicketViewMetricEngine(
    [
      new TitleTicketViewMetricAdjuster(new Map<string, number>([["central", 1.25]])),
      new CapTicketViewMetricAdjuster(6794),
      new PercentTicketViewMetricAdjuster(16.3),
    ],
    [],
    1.6,
    95828.4,
  );
}
