import { TouchpointSchedule } from "./touchpoint-schedule.js";

/** One step of the touchpoint schedule calculation. */
export interface TouchpointScheduleFactor {
  describe(): string;
  adjust(item: TouchpointSchedule, value: number): number;
}

export class PercentTouchpointScheduleAdjuster implements TouchpointScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TouchpointSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TouchpointScheduleClicksOffsetAdjuster implements TouchpointScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: TouchpointSchedule, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class CapTouchpointScheduleAdjuster implements TouchpointScheduleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointSchedule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameTouchpointScheduleAdjuster implements TouchpointScheduleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: TouchpointSchedule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTouchpointScheduleAdjuster implements TouchpointScheduleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TouchpointSchedule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the touchpoint schedule steps in order and keeps a trace of each. */
export class TouchpointScheduleEngine {
  steps: TouchpointScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TouchpointSchedule): number {
    let current = item.netLoad();
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

  evaluateAll(items: TouchpointSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTouchpointScheduleEngine(): TouchpointScheduleEngine {
  return new TouchpointScheduleEngine(
    [
      new PercentTouchpointScheduleAdjuster(-16.2),
      new TouchpointScheduleClicksOffsetAdjuster(1.29),
      new CapTouchpointScheduleAdjuster(48397),
      new NameTouchpointScheduleAdjuster(new Map<string, number>([["east", 1.34]])),
      new TieredTouchpointScheduleAdjuster([6484, 6899], [1.02, 1.01]),
    ],
    [],
    4.7,
    69560.7,
  );
}
