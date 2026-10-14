import * as numbers from "../../../../kit/numbers.js";
import { TouchpointSegment } from "./touchpoint-segment.js";

/** One step of the touchpoint segment calculation. */
export interface TouchpointSegmentFactor {
  describe(): string;
  adjust(item: TouchpointSegment, value: number): number;
}

export class ChannelTouchpointSegmentAdjuster implements TouchpointSegmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TouchpointSegment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentTouchpointSegmentAdjuster implements TouchpointSegmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointSegment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TouchpointSegmentMaximumOffsetAdjuster implements TouchpointSegmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: TouchpointSegment, value: number): number {
    return value + item.maximum * this.weight;
  }
}

/** Runs the touchpoint segment steps in order and keeps a trace of each. */
export class TouchpointSegmentEngine {
  steps: TouchpointSegmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointSegmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TouchpointSegment): number {
    let current = item.netExposure();
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

  evaluateAll(items: TouchpointSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTouchpointSegmentEngine(): TouchpointSegmentEngine {
  return new TouchpointSegmentEngine(
    [
      new ChannelTouchpointSegmentAdjuster(new Map<string, number>([["south", 0.78]])),
      new PercentTouchpointSegmentAdjuster(7.2),
      new TouchpointSegmentMaximumOffsetAdjuster(1.2),
    ],
    [],
    1.1,
    49961.3,
  );
}
