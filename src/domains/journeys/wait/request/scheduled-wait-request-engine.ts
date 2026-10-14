import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWaitRequest } from "./scheduled-wait-request.js";

/** One step of the scheduled wait request calculation. */
export interface ScheduledWaitRequestStep {
  describe(): string;
  adjust(item: ScheduledWaitRequest, value: number): number;
}

export class RoundingScheduledWaitRequestAdjuster implements ScheduledWaitRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWaitRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredScheduledWaitRequestAdjuster implements ScheduledWaitRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWaitRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledWaitRequestOpenRateOffsetAdjuster implements ScheduledWaitRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: ScheduledWaitRequest, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedScheduledWaitRequestAdjuster implements ScheduledWaitRequestStep {
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

  adjust(item: ScheduledWaitRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumScheduledWaitRequestAdjuster implements ScheduledWaitRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWaitRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentScheduledWaitRequestAdjuster implements ScheduledWaitRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWaitRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled wait request steps in order and keeps a trace of each. */
export class ScheduledWaitRequestEngine {
  steps: ScheduledWaitRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWaitRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWaitRequest): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ScheduledWaitRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWaitRequestEngine(flagsValue: flags.Registry): ScheduledWaitRequestEngine {
  return new ScheduledWaitRequestEngine(
    [
      new RoundingScheduledWaitRequestAdjuster(5),
      new TieredScheduledWaitRequestAdjuster([4370, 9610], [0.98, 0.91]),
      new ScheduledWaitRequestOpenRateOffsetAdjuster(0.58),
      new FlaggedScheduledWaitRequestAdjuster(flagsValue, "scheduled-wait-request-default", -6.5),
      new MinimumScheduledWaitRequestAdjuster(48.1),
      new PercentScheduledWaitRequestAdjuster(-0.2),
    ],
    [],
    4.8,
    82304.9,
  );
}
