import { ChallengeWindow } from "./challenge-window.js";

/** One step of the challenge window calculation. */
export interface ChallengeWindowAdjuster {
  describe(): string;
  adjust(item: ChallengeWindow, value: number): number;
}

export class MinimumChallengeWindowAdjuster implements ChallengeWindowAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeWindow, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleChallengeWindowAdjuster implements ChallengeWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ChallengeWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredChallengeWindowAdjuster implements ChallengeWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the challenge window steps in order and keeps a trace of each. */
export class ChallengeWindowEngine {
  steps: ChallengeWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ChallengeWindow): number {
    let current = item.netLoad();
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

  evaluateAll(items: ChallengeWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultChallengeWindowEngine(): ChallengeWindowEngine {
  return new ChallengeWindowEngine(
    [
      new MinimumChallengeWindowAdjuster(30.9),
      new LocaleChallengeWindowAdjuster(new Map<string, number>([["west", 0.76]])),
      new TieredChallengeWindowAdjuster([337, 6221], [1.06, 1.06]),
    ],
    [],
    2.3,
    84537.8,
  );
}
