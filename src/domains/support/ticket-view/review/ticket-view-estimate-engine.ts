import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewEstimate } from "./ticket-view-estimate.js";

/** One step of the ticket view estimate calculation. */
export interface TicketViewEstimateFactor {
  describe(): string;
  adjust(item: TicketViewEstimate, value: number): number;
}

export class TicketViewEstimateBudgetOffsetAdjuster implements TicketViewEstimateFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: TicketViewEstimate, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class FlaggedTicketViewEstimateAdjuster implements TicketViewEstimateFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: TicketViewEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumTicketViewEstimateAdjuster implements TicketViewEstimateFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the ticket view estimate steps in order and keeps a trace of each. */
export class TicketViewEstimateEngine {
  steps: TicketViewEstimateFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewEstimateFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewEstimate): number {
    let current = item.netVolume();
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

  evaluateAll(items: TicketViewEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewEstimateEngine(flagsValue: flags.Registry): TicketViewEstimateEngine {
  return new TicketViewEstimateEngine(
    [
      new TicketViewEstimateBudgetOffsetAdjuster(1.73),
      new FlaggedTicketViewEstimateAdjuster(flagsValue, "ticket-view-estimate-seasonal", 3.5),
      new MinimumTicketViewEstimateAdjuster(20.4),
    ],
    [],
    3.4,
    27728.5,
  );
}
