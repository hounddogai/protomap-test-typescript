import * as numbers from "../../../../kit/numbers.js";
import { PlacementNotice } from "./placement-notice.js";

/** One step of the placement notice calculation. */
export interface PlacementNoticeFactor {
  describe(): string;
  adjust(item: PlacementNotice, value: number): number;
}

export class RoundingPlacementNoticeAdjuster implements PlacementNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPlacementNoticeAdjuster implements PlacementNoticeFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PlacementNoticeClicksOffsetAdjuster implements PlacementNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: PlacementNotice, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class NamePlacementNoticeAdjuster implements PlacementNoticeFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PlacementNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPlacementNoticeAdjuster implements PlacementNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPlacementNoticeAdjuster implements PlacementNoticeFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the placement notice steps in order and keeps a trace of each. */
export class PlacementNoticeEngine {
  steps: PlacementNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementNotice): number {
    let current = item.netValue();
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

  evaluateAll(items: PlacementNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementNoticeEngine(): PlacementNoticeEngine {
  return new PlacementNoticeEngine(
    [
      new RoundingPlacementNoticeAdjuster(5),
      new CapPlacementNoticeAdjuster(37386),
      new PlacementNoticeClicksOffsetAdjuster(1.43),
      new NamePlacementNoticeAdjuster(new Map<string, number>([["central", 1.06], ["south", 0.73]])),
      new PercentPlacementNoticeAdjuster(8.2),
      new MinimumPlacementNoticeAdjuster(46.6),
    ],
    [],
    3.5,
    23210.5,
  );
}
