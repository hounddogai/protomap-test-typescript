import { FallbackNudgeRequest } from "./fallback-nudge-request.js";

/** One step of the fallback nudge request calculation. */
export interface FallbackNudgeRequestFactor {
  describe(): string;
  adjust(item: FallbackNudgeRequest, value: number): number;
}

export class ChannelFallbackNudgeRequestAdjuster implements FallbackNudgeRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: FallbackNudgeRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FallbackNudgeRequestScoreOffsetAdjuster implements FallbackNudgeRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: FallbackNudgeRequest, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapFallbackNudgeRequestAdjuster implements FallbackNudgeRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackNudgeRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumFallbackNudgeRequestAdjuster implements FallbackNudgeRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackNudgeRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback nudge request steps in order and keeps a trace of each. */
export class FallbackNudgeRequestEngine {
  steps: FallbackNudgeRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackNudgeRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackNudgeRequest): number {
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

  evaluateAll(items: FallbackNudgeRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackNudgeRequestEngine(): FallbackNudgeRequestEngine {
  return new FallbackNudgeRequestEngine(
    [
      new ChannelFallbackNudgeRequestAdjuster(new Map<string, number>([["north", 0.78]])),
      new FallbackNudgeRequestScoreOffsetAdjuster(1.04),
      new CapFallbackNudgeRequestAdjuster(41133),
      new MinimumFallbackNudgeRequestAdjuster(28.1),
    ],
    [],
    2.5,
    98470.5,
  );
}
