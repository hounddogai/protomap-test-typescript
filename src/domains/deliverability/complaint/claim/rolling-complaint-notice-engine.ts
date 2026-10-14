import * as numbers from "../../../../kit/numbers.js";
import { RollingComplaintNotice } from "./rolling-complaint-notice.js";

/** One step of the rolling complaint notice calculation. */
export interface RollingComplaintNoticeStep {
  describe(): string;
  adjust(item: RollingComplaintNotice, value: number): number;
}

export class ChannelRollingComplaintNoticeAdjuster implements RollingComplaintNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingComplaintNoticeAdjuster implements RollingComplaintNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RollingComplaintNoticeQuantityOffsetAdjuster implements RollingComplaintNoticeStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class CapRollingComplaintNoticeAdjuster implements RollingComplaintNoticeStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingRollingComplaintNoticeAdjuster implements RollingComplaintNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentRollingComplaintNoticeAdjuster implements RollingComplaintNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingComplaintNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling complaint notice steps in order and keeps a trace of each. */
export class RollingComplaintNoticeEngine {
  steps: RollingComplaintNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingComplaintNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingComplaintNotice): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RollingComplaintNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingComplaintNoticeEngine(): RollingComplaintNoticeEngine {
  return new RollingComplaintNoticeEngine(
    [
      new ChannelRollingComplaintNoticeAdjuster(new Map<string, number>([["east", 1.03], ["west", 0.93]])),
      new TieredRollingComplaintNoticeAdjuster([4862, 7728, 9325], [0.99, 1.03, 0.89]),
      new RollingComplaintNoticeQuantityOffsetAdjuster(0.53),
      new CapRollingComplaintNoticeAdjuster(29135),
      new RoundingRollingComplaintNoticeAdjuster(0.1),
      new PercentRollingComplaintNoticeAdjuster(-21.5),
    ],
    [],
    4,
    84232.2,
  );
}
