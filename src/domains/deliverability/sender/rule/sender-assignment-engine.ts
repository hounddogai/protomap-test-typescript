import * as numbers from "../../../../kit/numbers.js";
import { SenderAssignment } from "./sender-assignment.js";

/** One step of the sender assignment calculation. */
export interface SenderAssignmentAdjuster {
  describe(): string;
  adjust(item: SenderAssignment, value: number): number;
}

export class RoundingSenderAssignmentAdjuster implements SenderAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSenderAssignmentAdjuster implements SenderAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountrySenderAssignmentAdjuster implements SenderAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: SenderAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sender assignment steps in order and keeps a trace of each. */
export class SenderAssignmentEngine {
  steps: SenderAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderAssignment): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: SenderAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderAssignmentEngine(): SenderAssignmentEngine {
  return new SenderAssignmentEngine(
    [
      new RoundingSenderAssignmentAdjuster(0.5),
      new PercentSenderAssignmentAdjuster(18.8),
      new CountrySenderAssignmentAdjuster(
        new Map<string, number>([["west", 0.99], ["east", 1.2], ["central", 1.11]]),
      ),
    ],
    [],
    2.8,
    38041.1,
  );
}
