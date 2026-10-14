import { TouchpointOverride } from "./touchpoint-override.js";

/** One step of the touchpoint override calculation. */
export interface TouchpointOverrideAdjuster {
  describe(): string;
  adjust(item: TouchpointOverride, value: number): number;
}

export class CapTouchpointOverrideAdjuster implements TouchpointOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTouchpointOverrideAdjuster implements TouchpointOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTouchpointOverrideAdjuster implements TouchpointOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TouchpointOverrideEndsAtOffsetAdjuster implements TouchpointOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: TouchpointOverride, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the touchpoint override steps in order and keeps a trace of each. */
export class TouchpointOverrideEngine {
  steps: TouchpointOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointOverride): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TouchpointOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointOverrideEngine(): TouchpointOverrideEngine {
  return new TouchpointOverrideEngine(
    [
      new CapTouchpointOverrideAdjuster(41499),
      new PercentTouchpointOverrideAdjuster(-6.3),
      new TieredTouchpointOverrideAdjuster([642, 1932, 3175], [1.08, 0.85, 1.14]),
      new TouchpointOverrideEndsAtOffsetAdjuster(0.75),
    ],
    [],
    4.2,
    61605.2,
  );
}
