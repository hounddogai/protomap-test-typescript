import * as numbers from "../../../../kit/numbers.js";
import { NudgePlan } from "./nudge-plan.js";

/** One step of the nudge plan calculation. */
export interface NudgePlanModifier {
  describe(): string;
  adjust(item: NudgePlan, value: number): number;
}

export class LabelNudgePlanAdjuster implements NudgePlanModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: NudgePlan, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapNudgePlanAdjuster implements NudgePlanModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgePlan, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingNudgePlanAdjuster implements NudgePlanModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: NudgePlan, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the nudge plan steps in order and keeps a trace of each. */
export class NudgePlanEngine {
  steps: NudgePlanModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgePlanModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgePlan): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: NudgePlan[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgePlanEngine(): NudgePlanEngine {
  return new NudgePlanEngine(
    [
      new LabelNudgePlanAdjuster(new Map<string, number>([["east", 0.88], ["south", 1.18], ["central", 1.21]])),
      new CapNudgePlanAdjuster(17820),
      new RoundingNudgePlanAdjuster(0.1),
    ],
    [],
    3,
    69993.9,
  );
}
