import * as numbers from "../../../../kit/numbers.js";
import { NudgeNotice } from "./nudge-notice.js";

/** One step of the nudge notice calculation. */
export interface NudgeNoticeFactor {
  describe(): string;
  adjust(item: NudgeNotice, value: number): number;
}

export class NudgeNoticeMinimumOffsetAdjuster implements NudgeNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: NudgeNotice, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class TitleNudgeNoticeAdjuster implements NudgeNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: NudgeNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapNudgeNoticeAdjuster implements NudgeNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredNudgeNoticeAdjuster implements NudgeNoticeFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumNudgeNoticeAdjuster implements NudgeNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the nudge notice steps in order and keeps a trace of each. */
export class NudgeNoticeEngine {
  steps: NudgeNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: NudgeNotice): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: NudgeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultNudgeNoticeEngine(): NudgeNoticeEngine {
  return new NudgeNoticeEngine(
    [
      new NudgeNoticeMinimumOffsetAdjuster(0.25),
      new TitleNudgeNoticeAdjuster(new Map<string, number>([["west", 0.71], ["east", 0.94], ["online", 0.82]])),
      new CapNudgeNoticeAdjuster(11057),
      new TieredNudgeNoticeAdjuster([2290, 8356], [1.12, 0.84]),
      new MinimumNudgeNoticeAdjuster(46.3),
    ],
    [],
    1.5,
    28485.8,
  );
}
