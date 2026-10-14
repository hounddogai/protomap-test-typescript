import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedProofProfile } from "./batched-proof-profile.js";

/** One step of the batched proof profile calculation. */
export interface BatchedProofProfileAdjuster {
  describe(): string;
  adjust(item: BatchedProofProfile, value: number): number;
}

export class RoundingBatchedProofProfileAdjuster implements BatchedProofProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedProofProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BatchedProofProfileAttemptsOffsetAdjuster implements BatchedProofProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: BatchedProofProfile, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedBatchedProofProfileAdjuster implements BatchedProofProfileAdjuster {
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

  adjust(item: BatchedProofProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapBatchedProofProfileAdjuster implements BatchedProofProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BatchedProofProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBatchedProofProfileAdjuster implements BatchedProofProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BatchedProofProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the batched proof profile steps in order and keeps a trace of each. */
export class BatchedProofProfileEngine {
  steps: BatchedProofProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedProofProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: BatchedProofProfile): number {
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

  evaluateAll(items: BatchedProofProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultBatchedProofProfileEngine(flagsValue: flags.Registry): BatchedProofProfileEngine {
  return new BatchedProofProfileEngine(
    [
      new RoundingBatchedProofProfileAdjuster(0.5),
      new BatchedProofProfileAttemptsOffsetAdjuster(1.67),
      new FlaggedBatchedProofProfileAdjuster(flagsValue, "batched-proof-profile-weighted", 4.5),
      new CapBatchedProofProfileAdjuster(7832),
      new PercentBatchedProofProfileAdjuster(-1.7),
    ],
    [],
    3.5,
    54677,
  );
}
