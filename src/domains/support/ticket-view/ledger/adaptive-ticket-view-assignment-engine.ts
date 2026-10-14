import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

/** One step of the adaptive ticket view assignment calculation. */
export interface AdaptiveTicketViewAssignmentAdjuster {
  describe(): string;
  adjust(item: AdaptiveTicketViewAssignment, value: number): number;
}

export class CapAdaptiveTicketViewAssignmentAdjuster implements AdaptiveTicketViewAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveTicketViewAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveTicketViewAssignmentAdjuster implements AdaptiveTicketViewAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveTicketViewAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentAdaptiveTicketViewAssignmentAdjuster implements AdaptiveTicketViewAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveTicketViewAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive ticket view assignment steps in order and keeps a trace of each. */
export class AdaptiveTicketViewAssignmentEngine {
  steps: AdaptiveTicketViewAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveTicketViewAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveTicketViewAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: AdaptiveTicketViewAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveTicketViewAssignmentEngine(): AdaptiveTicketViewAssignmentEngine {
  return new AdaptiveTicketViewAssignmentEngine(
    [
      new CapAdaptiveTicketViewAssignmentAdjuster(21554),
      new MinimumAdaptiveTicketViewAssignmentAdjuster(5.1),
      new PercentAdaptiveTicketViewAssignmentAdjuster(5),
    ],
    [],
    2.3,
    13663,
  );
}
