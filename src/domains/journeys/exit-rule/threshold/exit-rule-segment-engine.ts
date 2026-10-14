import { ExitRuleSegment } from "./exit-rule-segment.js";

/** One step of the exit rule segment calculation. */
export interface ExitRuleSegmentModifier {
  describe(): string;
  adjust(item: ExitRuleSegment, value: number): number;
}

export class MinimumExitRuleSegmentAdjuster implements ExitRuleSegmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ExitRuleSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ExitRuleSegmentCeilingOffsetAdjuster implements ExitRuleSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ExitRuleSegment, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CategoryExitRuleSegmentAdjuster implements ExitRuleSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ExitRuleSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the exit rule segment steps in order and keeps a trace of each. */
export class ExitRuleSegmentEngine {
  steps: ExitRuleSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ExitRuleSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ExitRuleSegment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ExitRuleSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultExitRuleSegmentEngine(): ExitRuleSegmentEngine {
  return new ExitRuleSegmentEngine(
    [
      new MinimumExitRuleSegmentAdjuster(21.7),
      new ExitRuleSegmentCeilingOffsetAdjuster(1.95),
      new CategoryExitRuleSegmentAdjuster(new Map<string, number>([["west", 0.92]])),
    ],
    [],
    0.4,
    16247.6,
  );
}
