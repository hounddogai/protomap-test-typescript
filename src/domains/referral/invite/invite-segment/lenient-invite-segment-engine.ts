import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientInviteSegment } from "./lenient-invite-segment.js";

/** One step of the lenient invite segment calculation. */
export interface LenientInviteSegmentModifier {
  describe(): string;
  adjust(item: LenientInviteSegment, value: number): number;
}

export class FlaggedLenientInviteSegmentAdjuster implements LenientInviteSegmentModifier {
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

  adjust(item: LenientInviteSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLenientInviteSegmentAdjuster implements LenientInviteSegmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientInviteSegment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LenientInviteSegmentThresholdOffsetAdjuster implements LenientInviteSegmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LenientInviteSegment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class CapLenientInviteSegmentAdjuster implements LenientInviteSegmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientInviteSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient invite segment steps in order and keeps a trace of each. */
export class LenientInviteSegmentEngine {
  steps: LenientInviteSegmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientInviteSegmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LenientInviteSegment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: LenientInviteSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLenientInviteSegmentEngine(flagsValue: flags.Registry): LenientInviteSegmentEngine {
  return new LenientInviteSegmentEngine(
    [
      new FlaggedLenientInviteSegmentAdjuster(flagsValue, "lenient-invite-segment-fallback", -7.4),
      new TieredLenientInviteSegmentAdjuster([123, 4499, 9316, 9505], [0.88, 1.18, 1.01, 1.18]),
      new LenientInviteSegmentThresholdOffsetAdjuster(1.48),
      new CapLenientInviteSegmentAdjuster(32794),
    ],
    [],
    2.6,
    92993.3,
  );
}
