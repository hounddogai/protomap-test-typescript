import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainSegment } from "./domain-segment.js";

/** One step of the domain segment calculation. */
export interface DomainSegmentFactor {
  describe(): string;
  adjust(item: DomainSegment, value: number): number;
}

export class RoundingDomainSegmentAdjuster implements DomainSegmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDomainSegmentAdjuster implements DomainSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DomainSegmentMinimumOffsetAdjuster implements DomainSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus minimum times ${this.weight}`;
  }

  adjust(item: DomainSegment, value: number): number {
    return value + item.minimum * this.weight;
  }
}

export class MinimumDomainSegmentAdjuster implements DomainSegmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DomainSegment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDomainSegmentAdjuster implements DomainSegmentFactor {
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

  adjust(item: DomainSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain segment steps in order and keeps a trace of each. */
export class DomainSegmentEngine {
  steps: DomainSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DomainSegment): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DomainSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDomainSegmentEngine(flagsValue: flags.Registry): DomainSegmentEngine {
  return new DomainSegmentEngine(
    [
      new RoundingDomainSegmentAdjuster(5),
      new PercentDomainSegmentAdjuster(-2.8),
      new DomainSegmentMinimumOffsetAdjuster(1.93),
      new MinimumDomainSegmentAdjuster(0.1),
      new FlaggedDomainSegmentAdjuster(flagsValue, "domain-segment-adaptive", 8.3),
    ],
    [],
    3.9,
    8464.9,
  );
}
