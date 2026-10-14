import * as flags from "../../../../kit/flags.js";
import { PostClaim } from "./post-claim.js";

/** One step of the post claim calculation. */
export interface PostClaimFactor {
  describe(): string;
  adjust(item: PostClaim, value: number): number;
}

export class LabelPostClaimAdjuster implements PostClaimFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PostClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPostClaimAdjuster implements PostClaimFactor {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: PostClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPostClaimAdjuster implements PostClaimFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPostClaimAdjuster implements PostClaimFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumPostClaimAdjuster implements PostClaimFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PostClaimVersionOffsetAdjuster implements PostClaimFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: PostClaim, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the post claim steps in order and keeps a trace of each. */
export class PostClaimEngine {
  steps: PostClaimFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostClaimFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostClaim): number {
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

  evaluateAll(items: PostClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostClaimEngine(flagsValue: flags.Registry): PostClaimEngine {
  return new PostClaimEngine(
    [
      new LabelPostClaimAdjuster(new Map<string, number>([["south", 1.06], ["east", 0.76], ["west", 1.21]])),
      new FlaggedPostClaimAdjuster(flagsValue, "post-claim-default", 3.8),
      new CapPostClaimAdjuster(2209),
      new TieredPostClaimAdjuster([2588, 3063, 3670, 7644], [1.03, 1.06, 1.19, 0.94]),
      new MinimumPostClaimAdjuster(0.5),
      new PostClaimVersionOffsetAdjuster(1.77),
    ],
    [],
    1.6,
    78115.3,
  );
}
