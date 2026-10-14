import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingTouchpointSegment } from "./rolling-touchpoint-segment.js";

/** One step of the rolling touchpoint segment calculation. */
export interface RollingTouchpointSegmentModifier {
  describe(): string;
  adjust(item: RollingTouchpointSegment, value: number): number;
}

export class FlaggedRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
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

  adjust(item: RollingTouchpointSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingTouchpointSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingTouchpointSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CountryRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RollingTouchpointSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingTouchpointSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentRollingTouchpointSegmentAdjuster implements RollingTouchpointSegmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingTouchpointSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling touchpoint segment steps in order and keeps a trace of each. */
export class RollingTouchpointSegmentEngine {
  steps: RollingTouchpointSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingTouchpointSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingTouchpointSegment): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingTouchpointSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingTouchpointSegmentEngine(flagsValue: flags.Registry): RollingTouchpointSegmentEngine {
  return new RollingTouchpointSegmentEngine(
    [
      new FlaggedRollingTouchpointSegmentAdjuster(flagsValue, "rolling-touchpoint-segment-legacy", -5.4),
      new RoundingRollingTouchpointSegmentAdjuster(0.05),
      new CapRollingTouchpointSegmentAdjuster(42264),
      new CountryRollingTouchpointSegmentAdjuster(
        new Map<string, number>([["central", 0.9], ["south", 1.08], ["online", 1.03]]),
      ),
      new TieredRollingTouchpointSegmentAdjuster([1143, 2792, 3834, 7764], [1.19, 0.97, 1.11, 1.12]),
      new PercentRollingTouchpointSegmentAdjuster(-5.3),
    ],
    [],
    3.2,
    11485.4,
  );
}
