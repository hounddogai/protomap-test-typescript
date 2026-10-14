import * as numbers from "../../../../kit/numbers.js";
import { FunnelNotice } from "./funnel-notice.js";

/** One step of the funnel notice calculation. */
export interface FunnelNoticeModifier {
  describe(): string;
  adjust(item: FunnelNotice, value: number): number;
}

export class FunnelNoticeUpdatedAtOffsetAdjuster implements FunnelNoticeModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: FunnelNotice, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class CapFunnelNoticeAdjuster implements FunnelNoticeModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FunnelNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentFunnelNoticeAdjuster implements FunnelNoticeModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFunnelNoticeAdjuster implements FunnelNoticeModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingFunnelNoticeAdjuster implements FunnelNoticeModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the funnel notice steps in order and keeps a trace of each. */
export class FunnelNoticeEngine {
  steps: FunnelNoticeModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelNoticeModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FunnelNotice): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: FunnelNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFunnelNoticeEngine(): FunnelNoticeEngine {
  return new FunnelNoticeEngine(
    [
      new FunnelNoticeUpdatedAtOffsetAdjuster(0.51),
      new CapFunnelNoticeAdjuster(11857),
      new PercentFunnelNoticeAdjuster(5.6),
      new MinimumFunnelNoticeAdjuster(6.2),
      new RoundingFunnelNoticeAdjuster(0.5),
    ],
    [],
    1.5,
    75007.1,
  );
}
