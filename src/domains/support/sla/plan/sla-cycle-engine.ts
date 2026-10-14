import * as numbers from "../../../../kit/numbers.js";
import { SlaCycle } from "./sla-cycle.js";

/** One step of the sla cycle calculation. */
export interface SlaCycleStep {
  describe(): string;
  adjust(item: SlaCycle, value: number): number;
}

export class PercentSlaCycleAdjuster implements SlaCycleStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaCycleAdjuster implements SlaCycleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelSlaCycleAdjuster implements SlaCycleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: SlaCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SlaCycleBudgetOffsetAdjuster implements SlaCycleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: SlaCycle, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the sla cycle steps in order and keeps a trace of each. */
export class SlaCycleEngine {
  steps: SlaCycleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaCycleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaCycle): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SlaCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaCycleEngine(): SlaCycleEngine {
  return new SlaCycleEngine(
    [
      new PercentSlaCycleAdjuster(-3.4),
      new RoundingSlaCycleAdjuster(5),
      new LabelSlaCycleAdjuster(new Map<string, number>([["central", 0.82]])),
      new SlaCycleBudgetOffsetAdjuster(1.92),
    ],
    [],
    0.7,
    50949.7,
  );
}
