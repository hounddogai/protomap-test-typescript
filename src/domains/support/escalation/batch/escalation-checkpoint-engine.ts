import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationCheckpoint } from "./escalation-checkpoint.js";

/** One step of the escalation checkpoint calculation. */
export interface EscalationCheckpointStep {
  describe(): string;
  adjust(item: EscalationCheckpoint, value: number): number;
}

export class CapEscalationCheckpointAdjuster implements EscalationCheckpointStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingEscalationCheckpointAdjuster implements EscalationCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedEscalationCheckpointAdjuster implements EscalationCheckpointStep {
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

  adjust(item: EscalationCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEscalationCheckpointAdjuster implements EscalationCheckpointStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelEscalationCheckpointAdjuster implements EscalationCheckpointStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: EscalationCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class EscalationCheckpointQuantityOffsetAdjuster implements EscalationCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: EscalationCheckpoint, value: number): number {
    return value + item.quantity * this.weight;
  }
}

/** Runs the escalation checkpoint steps in order and keeps a trace of each. */
export class EscalationCheckpointEngine {
  steps: EscalationCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationCheckpoint): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: EscalationCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationCheckpointEngine(flagsValue: flags.Registry): EscalationCheckpointEngine {
  return new EscalationCheckpointEngine(
    [
      new CapEscalationCheckpointAdjuster(4208),
      new RoundingEscalationCheckpointAdjuster(0.05),
      new FlaggedEscalationCheckpointAdjuster(flagsValue, "escalation-checkpoint-global", -4.7),
      new MinimumEscalationCheckpointAdjuster(6.7),
      new LabelEscalationCheckpointAdjuster(new Map<string, number>([["north", 0.99], ["online", 1.25]])),
      new EscalationCheckpointQuantityOffsetAdjuster(0.18),
    ],
    [],
    0.4,
    87800.5,
  );
}
