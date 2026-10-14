import * as numbers from "../../../../kit/numbers.js";
import { PathMapping } from "./path-mapping.js";

/** One step of the path mapping calculation. */
export interface PathMappingAdjuster {
  describe(): string;
  adjust(item: PathMapping, value: number): number;
}

export class ChannelPathMappingAdjuster implements PathMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PathMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPathMappingAdjuster implements PathMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PathMappingOpenRateOffsetAdjuster implements PathMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: PathMapping, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class MinimumPathMappingAdjuster implements PathMappingAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPathMappingAdjuster implements PathMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPathMappingAdjuster implements PathMappingAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the path mapping steps in order and keeps a trace of each. */
export class PathMappingEngine {
  steps: PathMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathMapping): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PathMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathMappingEngine(): PathMappingEngine {
  return new PathMappingEngine(
    [
      new ChannelPathMappingAdjuster(new Map<string, number>([["central", 1.05]])),
      new PercentPathMappingAdjuster(-14.2),
      new PathMappingOpenRateOffsetAdjuster(0.14),
      new MinimumPathMappingAdjuster(41.9),
      new RoundingPathMappingAdjuster(0.1),
      new CapPathMappingAdjuster(10512),
    ],
    [],
    3.9,
    76075.1,
  );
}
