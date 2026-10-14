import * as flags from "../../../../kit/flags.js";
import { PostAudit } from "./post-audit.js";

/** One step of the post audit calculation. */
export interface PostAuditAdjuster {
  describe(): string;
  adjust(item: PostAudit, value: number): number;
}

export class MinimumPostAuditAdjuster implements PostAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PostAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedPostAuditAdjuster implements PostAuditAdjuster {
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

  adjust(item: PostAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPostAuditAdjuster implements PostAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PostAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPostAuditAdjuster implements PostAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePostAuditAdjuster implements PostAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PostAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the post audit steps in order and keeps a trace of each. */
export class PostAuditEngine {
  steps: PostAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostAudit): number {
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

  evaluateAll(items: PostAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostAuditEngine(flagsValue: flags.Registry): PostAuditEngine {
  return new PostAuditEngine(
    [
      new MinimumPostAuditAdjuster(47.4),
      new FlaggedPostAuditAdjuster(flagsValue, "post-audit-lenient", 0.5),
      new CapPostAuditAdjuster(31587),
      new TieredPostAuditAdjuster([4442, 4612], [0.86, 1.16]),
      new NamePostAuditAdjuster(new Map<string, number>([["online", 1.23], ["west", 1.02], ["south", 1.35]])),
    ],
    [],
    3.9,
    96876.8,
  );
}
