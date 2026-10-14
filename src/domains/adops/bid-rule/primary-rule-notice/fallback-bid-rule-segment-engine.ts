import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackBidRuleSegment } from "./fallback-bid-rule-segment.js";

/** One step of the fallback bid rule segment calculation. */
export interface FallbackBidRuleSegmentAdjuster {
  describe(): string;
  adjust(item: FallbackBidRuleSegment, value: number): number;
}

export class LabelFallbackBidRuleSegmentAdjuster implements FallbackBidRuleSegmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FallbackBidRuleSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackBidRuleSegmentAdjuster implements FallbackBidRuleSegmentAdjuster {
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

  adjust(item: FallbackBidRuleSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackBidRuleSegmentPriorityOffsetAdjuster implements FallbackBidRuleSegmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: FallbackBidRuleSegment, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class PercentFallbackBidRuleSegmentAdjuster implements FallbackBidRuleSegmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackBidRuleSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback bid rule segment steps in order and keeps a trace of each. */
export class FallbackBidRuleSegmentEngine {
  steps: FallbackBidRuleSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackBidRuleSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackBidRuleSegment): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: FallbackBidRuleSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackBidRuleSegmentEngine(flagsValue: flags.Registry): FallbackBidRuleSegmentEngine {
  return new FallbackBidRuleSegmentEngine(
    [
      new LabelFallbackBidRuleSegmentAdjuster(new Map<string, number>([["south", 1.07]])),
      new FlaggedFallbackBidRuleSegmentAdjuster(flagsValue, "fallback-bid-rule-segment-global", 6.6),
      new FallbackBidRuleSegmentPriorityOffsetAdjuster(1.96),
      new PercentFallbackBidRuleSegmentAdjuster(-5.2),
    ],
    [],
    0.6,
    87944.8,
  );
}
