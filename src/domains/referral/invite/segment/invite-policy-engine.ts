import * as numbers from "../../../../kit/numbers.js";
import { InvitePolicy } from "./invite-policy.js";

/** One step of the invite policy calculation. */
export interface InvitePolicyFactor {
  describe(): string;
  adjust(item: InvitePolicy, value: number): number;
}

export class TieredInvitePolicyAdjuster implements InvitePolicyFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InvitePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapInvitePolicyAdjuster implements InvitePolicyFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InvitePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class InvitePolicyEndsAtOffsetAdjuster implements InvitePolicyFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: InvitePolicy, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RoundingInvitePolicyAdjuster implements InvitePolicyFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InvitePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInvitePolicyAdjuster implements InvitePolicyFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InvitePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the invite policy steps in order and keeps a trace of each. */
export class InvitePolicyEngine {
  steps: InvitePolicyFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InvitePolicyFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InvitePolicy): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: InvitePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInvitePolicyEngine(): InvitePolicyEngine {
  return new InvitePolicyEngine(
    [
      new TieredInvitePolicyAdjuster([799, 4139, 6299, 9734], [1.04, 0.84, 1.15, 1.08]),
      new CapInvitePolicyAdjuster(45480),
      new InvitePolicyEndsAtOffsetAdjuster(1.53),
      new RoundingInvitePolicyAdjuster(1),
      new MinimumInvitePolicyAdjuster(38.8),
    ],
    [],
    1.1,
    56019.1,
  );
}
