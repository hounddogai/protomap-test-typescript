import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientSenderCheckpoint } from "./lenient-sender-checkpoint.js";

/** One step of the lenient sender checkpoint calculation. */
export interface LenientSenderCheckpointModifier {
  describe(): string;
  adjust(item: LenientSenderCheckpoint, value: number): number;
}

export class CapLenientSenderCheckpointAdjuster implements LenientSenderCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientSenderCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLenientSenderCheckpointAdjuster implements LenientSenderCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientSenderCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLenientSenderCheckpointAdjuster implements LenientSenderCheckpointModifier {
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

  adjust(item: LenientSenderCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientSenderCheckpointAdjuster implements LenientSenderCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientSenderCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientSenderCheckpointAdjuster implements LenientSenderCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientSenderCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient sender checkpoint steps in order and keeps a trace of each. */
export class LenientSenderCheckpointEngine {
  steps: LenientSenderCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientSenderCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientSenderCheckpoint): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: LenientSenderCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientSenderCheckpointEngine(flagsValue: flags.Registry): LenientSenderCheckpointEngine {
  return new LenientSenderCheckpointEngine(
    [
      new CapLenientSenderCheckpointAdjuster(7921),
      new MinimumLenientSenderCheckpointAdjuster(45.2),
      new FlaggedLenientSenderCheckpointAdjuster(flagsValue, "lenient-sender-checkpoint-adaptive", 1.6),
      new PercentLenientSenderCheckpointAdjuster(-24.4),
      new RoundingLenientSenderCheckpointAdjuster(0.5),
    ],
    [],
    4.6,
    33200.7,
  );
}
