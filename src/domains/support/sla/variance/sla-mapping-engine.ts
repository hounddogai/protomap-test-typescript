import * as numbers from "../../../../kit/numbers.js";
import { SlaMapping } from "./sla-mapping.js";

/** One step of the sla mapping calculation. */
export interface SlaMappingAdjuster {
  describe(): string;
  adjust(item: SlaMapping, value: number): number;
}

export class RoundingSlaMappingAdjuster implements SlaMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSlaMappingAdjuster implements SlaMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentSlaMappingAdjuster implements SlaMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SlaMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sla mapping steps in order and keeps a trace of each. */
export class SlaMappingEngine {
  steps: SlaMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaMapping): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: SlaMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaMappingEngine(): SlaMappingEngine {
  return new SlaMappingEngine(
    [
      new RoundingSlaMappingAdjuster(0.5),
      new MinimumSlaMappingAdjuster(17.7),
      new SegmentSlaMappingAdjuster(
        new Map<string, number>([["south", 1.15], ["west", 1.17], ["online", 0.87]]),
      ),
    ],
    [],
    3.4,
    61183.3,
  );
}
