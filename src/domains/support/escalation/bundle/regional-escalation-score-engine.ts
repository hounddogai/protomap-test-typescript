import * as numbers from "../../../../kit/numbers.js";
import { RegionalEscalationScore } from "./regional-escalation-score.js";

/** One step of the regional escalation score calculation. */
export interface RegionalEscalationScoreStep {
  describe(): string;
  adjust(item: RegionalEscalationScore, value: number): number;
}

export class RoundingRegionalEscalationScoreAdjuster implements RegionalEscalationScoreStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalEscalationScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalEscalationScoreAdjuster implements RegionalEscalationScoreStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalEscalationScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalEscalationScoreAdjuster implements RegionalEscalationScoreStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalEscalationScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalEscalationScoreCreatedAtOffsetAdjuster implements RegionalEscalationScoreStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: RegionalEscalationScore, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the regional escalation score steps in order and keeps a trace of each. */
export class RegionalEscalationScoreEngine {
  steps: RegionalEscalationScoreStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalEscalationScoreStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalEscalationScore): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RegionalEscalationScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalEscalationScoreEngine(): RegionalEscalationScoreEngine {
  return new RegionalEscalationScoreEngine(
    [
      new RoundingRegionalEscalationScoreAdjuster(0.1),
      new MinimumRegionalEscalationScoreAdjuster(19.3),
      new CapRegionalEscalationScoreAdjuster(38533),
      new RegionalEscalationScoreCreatedAtOffsetAdjuster(0.33),
    ],
    [],
    4.9,
    65876.4,
  );
}
