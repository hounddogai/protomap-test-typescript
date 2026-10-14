import * as numbers from "../../../../kit/numbers.js";
import { ScheduledSenderTarget } from "./scheduled-sender-target.js";

/** One step of the scheduled sender target calculation. */
export interface ScheduledSenderTargetModifier {
  describe(): string;
  adjust(item: ScheduledSenderTarget, value: number): number;
}

export class RoundingScheduledSenderTargetAdjuster implements ScheduledSenderTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapScheduledSenderTargetAdjuster implements ScheduledSenderTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CategoryScheduledSenderTargetAdjuster implements ScheduledSenderTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentScheduledSenderTargetAdjuster implements ScheduledSenderTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledSenderTargetRetriesOffsetAdjuster implements ScheduledSenderTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class MinimumScheduledSenderTargetAdjuster implements ScheduledSenderTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledSenderTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled sender target steps in order and keeps a trace of each. */
export class ScheduledSenderTargetEngine {
  steps: ScheduledSenderTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledSenderTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledSenderTarget): number {
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

  evaluateAll(items: ScheduledSenderTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledSenderTargetEngine(): ScheduledSenderTargetEngine {
  return new ScheduledSenderTargetEngine(
    [
      new RoundingScheduledSenderTargetAdjuster(0.05),
      new CapScheduledSenderTargetAdjuster(3624),
      new CategoryScheduledSenderTargetAdjuster(
        new Map<string, number>([["central", 0.76], ["online", 1.27], ["north", 0.77]]),
      ),
      new PercentScheduledSenderTargetAdjuster(-4.9),
      new ScheduledSenderTargetRetriesOffsetAdjuster(1.04),
      new MinimumScheduledSenderTargetAdjuster(41.7),
    ],
    [],
    2.4,
    52219.5,
  );
}
