import * as numbers from "../../../../kit/numbers.js";
import { GlobalChallengeCycle } from "./global-challenge-cycle.js";

/** One step of the global challenge cycle calculation. */
export interface GlobalChallengeCycleStep {
  describe(): string;
  adjust(item: GlobalChallengeCycle, value: number): number;
}

export class TitleGlobalChallengeCycleAdjuster implements GlobalChallengeCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: GlobalChallengeCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalChallengeCycleAdjuster implements GlobalChallengeCycleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalChallengeCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalChallengeCycleAdjuster implements GlobalChallengeCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalChallengeCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global challenge cycle steps in order and keeps a trace of each. */
export class GlobalChallengeCycleEngine {
  steps: GlobalChallengeCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalChallengeCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalChallengeCycle): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: GlobalChallengeCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalChallengeCycleEngine(): GlobalChallengeCycleEngine {
  return new GlobalChallengeCycleEngine(
    [
      new TitleGlobalChallengeCycleAdjuster(
        new Map<string, number>([["north", 0.8], ["central", 0.97], ["east", 1.24]]),
      ),
      new CapGlobalChallengeCycleAdjuster(20780),
      new RoundingGlobalChallengeCycleAdjuster(0.5),
    ],
    [],
    0.6,
    75663.8,
  );
}
