import { MentionMapping } from "./mention-mapping.js";

/** One step of the mention mapping calculation. */
export interface MentionMappingStep {
  describe(): string;
  adjust(item: MentionMapping, value: number): number;
}

export class MinimumMentionMappingAdjuster implements MentionMappingStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapMentionMappingAdjuster implements MentionMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MentionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceMentionMappingAdjuster implements MentionMappingStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: MentionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the mention mapping steps in order and keeps a trace of each. */
export class MentionMappingEngine {
  steps: MentionMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MentionMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: MentionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMentionMappingEngine(): MentionMappingEngine {
  return new MentionMappingEngine(
    [
      new MinimumMentionMappingAdjuster(36.1),
      new CapMentionMappingAdjuster(46469),
      new UtmSourceMentionMappingAdjuster(
        new Map<string, number>([["retail", 0.98], ["south", 1.36], ["online", 1.4]]),
      ),
    ],
    [],
    2.2,
    40484,
  );
}
