import { LenientSlaNotice } from "./lenient-sla-notice.js";

/** One step of the lenient sla notice calculation. */
export interface LenientSlaNoticeAdjuster {
  describe(): string;
  adjust(item: LenientSlaNotice, value: number): number;
}

export class MinimumLenientSlaNoticeAdjuster implements LenientSlaNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientSlaNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameLenientSlaNoticeAdjuster implements LenientSlaNoticeAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: LenientSlaNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientSlaNoticeAdjuster implements LenientSlaNoticeAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientSlaNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient sla notice steps in order and keeps a trace of each. */
export class LenientSlaNoticeEngine {
  steps: LenientSlaNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSlaNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientSlaNotice): number {
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

  evaluateAll(items: LenientSlaNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientSlaNoticeEngine(): LenientSlaNoticeEngine {
  return new LenientSlaNoticeEngine(
    [
      new MinimumLenientSlaNoticeAdjuster(1.4),
      new NameLenientSlaNoticeAdjuster(new Map<string, number>([["online", 1.2]])),
      new TieredLenientSlaNoticeAdjuster([1152, 2476, 3328, 5579], [1.07, 1.08, 1.01, 0.99]),
    ],
    [],
    1.7,
    57587.5,
  );
}
