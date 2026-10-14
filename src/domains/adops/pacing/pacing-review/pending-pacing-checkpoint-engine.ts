import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingPacingCheckpoint } from "./pending-pacing-checkpoint.js";

/** One step of the pending pacing checkpoint calculation. */
export interface PendingPacingCheckpointModifier {
  describe(): string;
  adjust(item: PendingPacingCheckpoint, value: number): number;
}

export class ChannelPendingPacingCheckpointAdjuster implements PendingPacingCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingPacingCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPendingPacingCheckpointAdjuster implements PendingPacingCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingPacingCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingPacingCheckpointAdjuster implements PendingPacingCheckpointModifier {
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

  adjust(item: PendingPacingCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PendingPacingCheckpointThresholdOffsetAdjuster implements PendingPacingCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PendingPacingCheckpoint, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentPendingPacingCheckpointAdjuster implements PendingPacingCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingPacingCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending pacing checkpoint steps in order and keeps a trace of each. */
export class PendingPacingCheckpointEngine {
  steps: PendingPacingCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingPacingCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingPacingCheckpoint): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingPacingCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingPacingCheckpointEngine(flagsValue: flags.Registry): PendingPacingCheckpointEngine {
  return new PendingPacingCheckpointEngine(
    [
      new ChannelPendingPacingCheckpointAdjuster(new Map<string, number>([["east", 1.04], ["retail", 0.71]])),
      new CapPendingPacingCheckpointAdjuster(49201),
      new FlaggedPendingPacingCheckpointAdjuster(flagsValue, "pending-pacing-checkpoint-global", 7.6),
      new PendingPacingCheckpointThresholdOffsetAdjuster(1.5),
      new PercentPendingPacingCheckpointAdjuster(-0.1),
    ],
    [],
    3.4,
    39171.2,
  );
}
