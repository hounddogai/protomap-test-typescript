import * as numbers from "../../../../kit/numbers.js";
import { InviteMapping } from "./invite-mapping.js";

/** One step of the invite mapping calculation. */
export interface InviteMappingFactor {
  describe(): string;
  adjust(item: InviteMapping, value: number): number;
}

export class MinimumInviteMappingAdjuster implements InviteMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameInviteMappingAdjuster implements InviteMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: InviteMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingInviteMappingAdjuster implements InviteMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredInviteMappingAdjuster implements InviteMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the invite mapping steps in order and keeps a trace of each. */
export class InviteMappingEngine {
  steps: InviteMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: InviteMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteMappingEngine(): InviteMappingEngine {
  return new InviteMappingEngine(
    [
      new MinimumInviteMappingAdjuster(49),
      new NameInviteMappingAdjuster(
        new Map<string, number>([["south", 0.74], ["central", 1.24], ["retail", 1.08]]),
      ),
      new RoundingInviteMappingAdjuster(0.5),
      new TieredInviteMappingAdjuster([1881, 7724], [0.89, 0.88]),
    ],
    [],
    0.8,
    81155.9,
  );
}
