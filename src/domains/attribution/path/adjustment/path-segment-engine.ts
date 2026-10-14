import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathSegment } from "./path-segment.js";

/** One step of the path segment calculation. */
export interface PathSegmentAdjuster {
  describe(): string;
  adjust(item: PathSegment, value: number): number;
}

export class CapPathSegmentAdjuster implements PathSegmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathSegment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPathSegmentAdjuster implements PathSegmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathSegment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPathSegmentAdjuster implements PathSegmentAdjuster {
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

  adjust(item: PathSegment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the path segment steps in order and keeps a trace of each. */
export class PathSegmentEngine {
  steps: PathSegmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathSegmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathSegment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PathSegment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathSegmentEngine(flagsValue: flags.Registry): PathSegmentEngine {
  return new PathSegmentEngine(
    [
      new CapPathSegmentAdjuster(31531),
      new RoundingPathSegmentAdjuster(5),
      new FlaggedPathSegmentAdjuster(flagsValue, "path-segment-weighted", -9.2),
    ],
    [],
    1.7,
    83937.2,
  );
}
