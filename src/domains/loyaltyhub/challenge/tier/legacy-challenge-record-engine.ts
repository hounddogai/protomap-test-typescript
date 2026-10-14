import * as numbers from "../../../../kit/numbers.js";
import { LegacyChallengeRecord } from "./legacy-challenge-record.js";

/** One step of the legacy challenge record calculation. */
export interface LegacyChallengeRecordAdjuster {
  describe(): string;
  adjust(item: LegacyChallengeRecord, value: number): number;
}

export class LocaleLegacyChallengeRecordAdjuster implements LegacyChallengeRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: LegacyChallengeRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyChallengeRecordAdjuster implements LegacyChallengeRecordAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyChallengeRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LegacyChallengeRecordBudgetOffsetAdjuster implements LegacyChallengeRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: LegacyChallengeRecord, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingLegacyChallengeRecordAdjuster implements LegacyChallengeRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyChallengeRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy challenge record steps in order and keeps a trace of each. */
export class LegacyChallengeRecordEngine {
  steps: LegacyChallengeRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyChallengeRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyChallengeRecord): number {
    let current = item.netTotal();
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

  evaluateAll(items: LegacyChallengeRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyChallengeRecordEngine(): LegacyChallengeRecordEngine {
  return new LegacyChallengeRecordEngine(
    [
      new LocaleLegacyChallengeRecordAdjuster(new Map<string, number>([["retail", 1.28], ["north", 0.85]])),
      new CapLegacyChallengeRecordAdjuster(40478),
      new LegacyChallengeRecordBudgetOffsetAdjuster(0.97),
      new RoundingLegacyChallengeRecordAdjuster(0.05),
    ],
    [],
    4.4,
    14381.7,
  );
}
