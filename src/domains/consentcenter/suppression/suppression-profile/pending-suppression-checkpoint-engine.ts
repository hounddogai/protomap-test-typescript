import * as flags from "../../../../kit/flags.js";
import { PendingSuppressionCheckpoint } from "./pending-suppression-checkpoint.js";

/** One step of the pending suppression checkpoint calculation. */
export interface PendingSuppressionCheckpointFactor {
  describe(): string;
  adjust(item: PendingSuppressionCheckpoint, value: number): number;
}

export class TieredPendingSuppressionCheckpointAdjuster implements PendingSuppressionCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingSuppressionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingSuppressionCheckpointAdjuster implements PendingSuppressionCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingSuppressionCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingSuppressionCheckpointAdjuster implements PendingSuppressionCheckpointFactor {
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

  adjust(item: PendingSuppressionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingSuppressionCheckpointDiscountOffsetAdjuster implements PendingSuppressionCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: PendingSuppressionCheckpoint, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the pending suppression checkpoint steps in order and keeps a trace of each. */
export class PendingSuppressionCheckpointEngine {
  steps: PendingSuppressionCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSuppressionCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingSuppressionCheckpoint): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: PendingSuppressionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingSuppressionCheckpointEngine(flagsValue: flags.Registry): PendingSuppressionCheckpointEngine {
  return new PendingSuppressionCheckpointEngine(
    [
      new TieredPendingSuppressionCheckpointAdjuster([134, 3086, 7649], [0.93, 0.98, 1]),
      new CapPendingSuppressionCheckpointAdjuster(47001),
      new FlaggedPendingSuppressionCheckpointAdjuster(
        flagsValue,
        "pending-suppression-checkpoint-batched",
        -2.4,
      ),
      new PendingSuppressionCheckpointDiscountOffsetAdjuster(1.46),
    ],
    [],
    1.4,
    31869.6,
  );
}
