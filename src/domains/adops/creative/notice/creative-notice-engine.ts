import * as numbers from "../../../../kit/numbers.js";
import { CreativeNotice } from "./creative-notice.js";

/** One step of the creative notice calculation. */
export interface CreativeNoticeModifier {
  describe(): string;
  adjust(item: CreativeNotice, value: number): number;
}

export class TieredCreativeNoticeAdjuster implements CreativeNoticeModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingCreativeNoticeAdjuster implements CreativeNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapCreativeNoticeAdjuster implements CreativeNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CreativeNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the creative notice steps in order and keeps a trace of each. */
export class CreativeNoticeEngine {
  steps: CreativeNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeNotice): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: CreativeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeNoticeEngine(): CreativeNoticeEngine {
  return new CreativeNoticeEngine(
    [
      new TieredCreativeNoticeAdjuster([835, 2244, 5475], [0.85, 0.84, 1.02]),
      new RoundingCreativeNoticeAdjuster(1),
      new CapCreativeNoticeAdjuster(12387),
    ],
    [],
    2.9,
    38632.9,
  );
}
