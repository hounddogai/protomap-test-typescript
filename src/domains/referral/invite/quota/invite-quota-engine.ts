import * as numbers from "../../../../kit/numbers.js";
import { InviteQuota } from "./invite-quota.js";

/** One step of the invite quota calculation. */
export interface InviteQuotaModifier {
  describe(): string;
  adjust(item: InviteQuota, value: number): number;
}

export class CapInviteQuotaAdjuster implements InviteQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumInviteQuotaAdjuster implements InviteQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingInviteQuotaAdjuster implements InviteQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the invite quota steps in order and keeps a trace of each. */
export class InviteQuotaEngine {
  steps: InviteQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteQuota): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InviteQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteQuotaEngine(): InviteQuotaEngine {
  return new InviteQuotaEngine(
    [
      new CapInviteQuotaAdjuster(28936),
      new MinimumInviteQuotaAdjuster(5.7),
      new RoundingInviteQuotaAdjuster(0.1),
    ],
    [],
    1.8,
    81915.2,
  );
}
