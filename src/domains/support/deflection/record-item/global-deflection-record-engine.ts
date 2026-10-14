import * as numbers from "../../../../kit/numbers.js";
import { GlobalDeflectionRecord } from "./global-deflection-record.js";

/** One step of the global deflection record calculation. */
export interface GlobalDeflectionRecordStep {
  describe(): string;
  adjust(item: GlobalDeflectionRecord, value: number): number;
}

export class LabelGlobalDeflectionRecordAdjuster implements GlobalDeflectionRecordStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalDeflectionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalDeflectionRecordAdjuster implements GlobalDeflectionRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalDeflectionRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class GlobalDeflectionRecordEndsAtOffsetAdjuster implements GlobalDeflectionRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: GlobalDeflectionRecord, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingGlobalDeflectionRecordAdjuster implements GlobalDeflectionRecordStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalDeflectionRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the global deflection record steps in order and keeps a trace of each. */
export class GlobalDeflectionRecordEngine {
  steps: GlobalDeflectionRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalDeflectionRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalDeflectionRecord): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: GlobalDeflectionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalDeflectionRecordEngine(): GlobalDeflectionRecordEngine {
  return new GlobalDeflectionRecordEngine(
    [
      new LabelGlobalDeflectionRecordAdjuster(new Map<string, number>([["south", 0.83], ["online", 1.11]])),
      new MinimumGlobalDeflectionRecordAdjuster(32.1),
      new GlobalDeflectionRecordEndsAtOffsetAdjuster(0.24),
      new RoundingGlobalDeflectionRecordAdjuster(5),
    ],
    [],
    2.4,
    74687.8,
  );
}
