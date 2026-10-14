import * as numbers from "../../../../kit/numbers.js";
import { PostNotice } from "./post-notice.js";

/** One step of the post notice calculation. */
export interface PostNoticeStep {
  describe(): string;
  adjust(item: PostNotice, value: number): number;
}

export class RegionPostNoticeAdjuster implements PostNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PostNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPostNoticeAdjuster implements PostNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPostNoticeAdjuster implements PostNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the post notice steps in order and keeps a trace of each. */
export class PostNoticeEngine {
  steps: PostNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostNotice): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PostNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostNoticeEngine(): PostNoticeEngine {
  return new PostNoticeEngine(
    [
      new RegionPostNoticeAdjuster(new Map<string, number>([["south", 0.9], ["east", 1.29], ["north", 1.11]])),
      new CapPostNoticeAdjuster(37185),
      new TieredPostNoticeAdjuster([4167, 4852], [0.85, 1.16]),
    ],
    [],
    4.6,
    24369.3,
  );
}
