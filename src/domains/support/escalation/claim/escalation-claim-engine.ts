import * as flags from "../../../../kit/flags.js";
import { EscalationClaim } from "./escalation-claim.js";

/** One step of the escalation claim calculation. */
export interface EscalationClaimStep {
  describe(): string;
  adjust(item: EscalationClaim, value: number): number;
}

export class EscalationClaimDurationMinutesOffsetAdjuster implements EscalationClaimStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: EscalationClaim, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapEscalationClaimAdjuster implements EscalationClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEscalationClaimAdjuster implements EscalationClaimStep {
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

  adjust(item: EscalationClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleEscalationClaimAdjuster implements EscalationClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: EscalationClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumEscalationClaimAdjuster implements EscalationClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the escalation claim steps in order and keeps a trace of each. */
export class EscalationClaimEngine {
  steps: EscalationClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: EscalationClaim): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: EscalationClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultEscalationClaimEngine(flagsValue: flags.Registry): EscalationClaimEngine {
  return new EscalationClaimEngine(
    [
      new EscalationClaimDurationMinutesOffsetAdjuster(1.44),
      new CapEscalationClaimAdjuster(10870),
      new FlaggedEscalationClaimAdjuster(flagsValue, "escalation-claim-batched", -3.5),
      new TitleEscalationClaimAdjuster(
        new Map<string, number>([["south", 0.87], ["central", 1.01], ["west", 1.28]]),
      ),
      new MinimumEscalationClaimAdjuster(47.2),
    ],
    [],
    4.2,
    88807.4,
  );
}
