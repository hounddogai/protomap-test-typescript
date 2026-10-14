import * as numbers from "../../../../kit/numbers.js";
import { LenientReputationScore } from "./lenient-reputation-score.js";

/** One step of the lenient reputation score calculation. */
export interface LenientReputationScoreAdjuster {
  describe(): string;
  adjust(item: LenientReputationScore, value: number): number;
}

export class MinimumLenientReputationScoreAdjuster implements LenientReputationScoreAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientReputationScore, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapLenientReputationScoreAdjuster implements LenientReputationScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientReputationScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLenientReputationScoreAdjuster implements LenientReputationScoreAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientReputationScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceLenientReputationScoreAdjuster implements LenientReputationScoreAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: LenientReputationScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentLenientReputationScoreAdjuster implements LenientReputationScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientReputationScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the lenient reputation score steps in order and keeps a trace of each. */
export class LenientReputationScoreEngine {
  steps: LenientReputationScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientReputationScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientReputationScore): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientReputationScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientReputationScoreEngine(): LenientReputationScoreEngine {
  return new LenientReputationScoreEngine(
    [
      new MinimumLenientReputationScoreAdjuster(17.1),
      new CapLenientReputationScoreAdjuster(28434),
      new RoundingLenientReputationScoreAdjuster(1),
      new SourceLenientReputationScoreAdjuster(new Map<string, number>([["online", 1.28], ["east", 0.79]])),
      new PercentLenientReputationScoreAdjuster(-16.5),
    ],
    [],
    3.6,
    30553.7,
  );
}
