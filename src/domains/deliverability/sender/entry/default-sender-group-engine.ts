import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSenderGroup } from "./default-sender-group.js";

/** One step of the default sender group calculation. */
export interface DefaultSenderGroupFactor {
  describe(): string;
  adjust(item: DefaultSenderGroup, value: number): number;
}

export class CapDefaultSenderGroupAdjuster implements DefaultSenderGroupFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultSenderGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDefaultSenderGroupAdjuster implements DefaultSenderGroupFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultSenderGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultSenderGroupAdjuster implements DefaultSenderGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultSenderGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultSenderGroupAdjuster implements DefaultSenderGroupFactor {
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

  adjust(item: DefaultSenderGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default sender group steps in order and keeps a trace of each. */
export class DefaultSenderGroupEngine {
  steps: DefaultSenderGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultSenderGroup): number {
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

  evaluateAll(items: DefaultSenderGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultSenderGroupEngine(flagsValue: flags.Registry): DefaultSenderGroupEngine {
  return new DefaultSenderGroupEngine(
    [
      new CapDefaultSenderGroupAdjuster(29301),
      new PercentDefaultSenderGroupAdjuster(-19.3),
      new RoundingDefaultSenderGroupAdjuster(1),
      new FlaggedDefaultSenderGroupAdjuster(flagsValue, "default-sender-group-global", 4.4),
    ],
    [],
    2.5,
    67580.6,
  );
}
