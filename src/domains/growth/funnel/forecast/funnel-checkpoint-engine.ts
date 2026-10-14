import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelCheckpoint } from "./funnel-checkpoint.js";

/** One step of the funnel checkpoint calculation. */
export interface FunnelCheckpointAdjuster {
  describe(): string;
  adjust(item: FunnelCheckpoint, value: number): number;
}

export class FunnelCheckpointDiscountOffsetAdjuster implements FunnelCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: FunnelCheckpoint, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class MinimumFunnelCheckpointAdjuster implements FunnelCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelFunnelCheckpointAdjuster implements FunnelCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: FunnelCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingFunnelCheckpointAdjuster implements FunnelCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedFunnelCheckpointAdjuster implements FunnelCheckpointAdjuster {
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

  adjust(item: FunnelCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFunnelCheckpointAdjuster implements FunnelCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the funnel checkpoint steps in order and keeps a trace of each. */
export class FunnelCheckpointEngine {
  steps: FunnelCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FunnelCheckpoint): number {
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

  evaluateAll(items: FunnelCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFunnelCheckpointEngine(flagsValue: flags.Registry): FunnelCheckpointEngine {
  return new FunnelCheckpointEngine(
    [
      new FunnelCheckpointDiscountOffsetAdjuster(0.39),
      new MinimumFunnelCheckpointAdjuster(1.5),
      new LabelFunnelCheckpointAdjuster(
        new Map<string, number>([["central", 1.07], ["east", 0.83], ["west", 1.39]]),
      ),
      new RoundingFunnelCheckpointAdjuster(1),
      new FlaggedFunnelCheckpointAdjuster(flagsValue, "funnel-checkpoint-seasonal", 4.4),
      new PercentFunnelCheckpointAdjuster(-8.8),
    ],
    [],
    3,
    44565.2,
  );
}
