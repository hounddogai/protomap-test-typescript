import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WaitCheckpoint } from "./wait-checkpoint.js";

/** One step of the wait checkpoint calculation. */
export interface WaitCheckpointFactor {
  describe(): string;
  adjust(item: WaitCheckpoint, value: number): number;
}

export class PercentWaitCheckpointAdjuster implements WaitCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WaitCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWaitCheckpointAdjuster implements WaitCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WaitCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WaitCheckpointAttemptsOffsetAdjuster implements WaitCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: WaitCheckpoint, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class RoundingWaitCheckpointAdjuster implements WaitCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WaitCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWaitCheckpointAdjuster implements WaitCheckpointFactor {
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

  adjust(item: WaitCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the wait checkpoint steps in order and keeps a trace of each. */
export class WaitCheckpointEngine {
  steps: WaitCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WaitCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WaitCheckpoint): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WaitCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWaitCheckpointEngine(flagsValue: flags.Registry): WaitCheckpointEngine {
  return new WaitCheckpointEngine(
    [
      new PercentWaitCheckpointAdjuster(20.2),
      new CapWaitCheckpointAdjuster(48915),
      new WaitCheckpointAttemptsOffsetAdjuster(1.98),
      new RoundingWaitCheckpointAdjuster(0.1),
      new FlaggedWaitCheckpointAdjuster(flagsValue, "wait-checkpoint-capped", -5.7),
    ],
    [],
    1.1,
    6354.7,
  );
}
