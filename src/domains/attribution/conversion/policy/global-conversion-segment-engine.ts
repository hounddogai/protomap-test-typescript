import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalConversionSegment } from "./global-conversion-segment.js";

/** One step of the global conversion segment calculation. */
export interface GlobalConversionSegmentStep {
  describe(): string;
  adjust(item: GlobalConversionSegment, value: number): number;
}

export class FlaggedGlobalConversionSegmentAdjuster implements GlobalConversionSegmentStep {
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

  adjust(item: GlobalConversionSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentGlobalConversionSegmentAdjuster implements GlobalConversionSegmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalConversionSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalConversionSegmentAdjuster implements GlobalConversionSegmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalConversionSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalConversionSegmentAdjuster implements GlobalConversionSegmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalConversionSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalConversionSegmentPriorityOffsetAdjuster implements GlobalConversionSegmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: GlobalConversionSegment, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the global conversion segment steps in order and keeps a trace of each. */
export class GlobalConversionSegmentEngine {
  steps: GlobalConversionSegmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalConversionSegmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalConversionSegment): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: GlobalConversionSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalConversionSegmentEngine(flagsValue: flags.Registry): GlobalConversionSegmentEngine {
  return new GlobalConversionSegmentEngine(
    [
      new FlaggedGlobalConversionSegmentAdjuster(flagsValue, "global-conversion-segment-strict", 8.8),
      new PercentGlobalConversionSegmentAdjuster(0.3),
      new RoundingGlobalConversionSegmentAdjuster(1),
      new CapGlobalConversionSegmentAdjuster(38923),
      new GlobalConversionSegmentPriorityOffsetAdjuster(1.02),
    ],
    [],
    4.1,
    8974.2,
  );
}
