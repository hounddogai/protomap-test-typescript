import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

/** One step of the primary proof checkpoint calculation. */
export interface PrimaryProofCheckpointStep {
  describe(): string;
  adjust(item: PrimaryProofCheckpoint, value: number): number;
}

export class FlaggedPrimaryProofCheckpointAdjuster implements PrimaryProofCheckpointStep {
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

  adjust(item: PrimaryProofCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryProofCheckpointAdjuster implements PrimaryProofCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryProofCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPrimaryProofCheckpointAdjuster implements PrimaryProofCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryProofCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the primary proof checkpoint steps in order and keeps a trace of each. */
export class PrimaryProofCheckpointEngine {
  steps: PrimaryProofCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryProofCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryProofCheckpoint): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PrimaryProofCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryProofCheckpointEngine(flagsValue: flags.Registry): PrimaryProofCheckpointEngine {
  return new PrimaryProofCheckpointEngine(
    [
      new FlaggedPrimaryProofCheckpointAdjuster(flagsValue, "primary-proof-checkpoint-seasonal", -4.4),
      new CapPrimaryProofCheckpointAdjuster(19058),
      new RoundingPrimaryProofCheckpointAdjuster(0.5),
    ],
    [],
    2.3,
    98859.2,
  );
}
