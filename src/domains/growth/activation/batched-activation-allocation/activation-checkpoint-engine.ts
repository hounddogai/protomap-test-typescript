import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationCheckpoint } from "./activation-checkpoint.js";

/** One step of the activation checkpoint calculation. */
export interface ActivationCheckpointModifier {
  describe(): string;
  adjust(item: ActivationCheckpoint, value: number): number;
}

export class FlaggedActivationCheckpointAdjuster implements ActivationCheckpointModifier {
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

  adjust(item: ActivationCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ActivationCheckpointBudgetOffsetAdjuster implements ActivationCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: ActivationCheckpoint, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class RoundingActivationCheckpointAdjuster implements ActivationCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentActivationCheckpointAdjuster implements ActivationCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapActivationCheckpointAdjuster implements ActivationCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ActivationCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumActivationCheckpointAdjuster implements ActivationCheckpointModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ActivationCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the activation checkpoint steps in order and keeps a trace of each. */
export class ActivationCheckpointEngine {
  steps: ActivationCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationCheckpoint): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: ActivationCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationCheckpointEngine(flagsValue: flags.Registry): ActivationCheckpointEngine {
  return new ActivationCheckpointEngine(
    [
      new FlaggedActivationCheckpointAdjuster(flagsValue, "activation-checkpoint-tiered", -6.7),
      new ActivationCheckpointBudgetOffsetAdjuster(1.95),
      new RoundingActivationCheckpointAdjuster(0.05),
      new PercentActivationCheckpointAdjuster(-12.5),
      new CapActivationCheckpointAdjuster(47477),
      new MinimumActivationCheckpointAdjuster(37.8),
    ],
    [],
    3.1,
    69206.5,
  );
}
