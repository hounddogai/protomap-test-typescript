import * as numbers from "../../../../kit/numbers.js";
import { InviteGroup } from "./invite-group.js";

/** One step of the invite group calculation. */
export interface InviteGroupAdjuster {
  describe(): string;
  adjust(item: InviteGroup, value: number): number;
}

export class TieredInviteGroupAdjuster implements InviteGroupAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteGroup, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInviteGroupAdjuster implements InviteGroupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInviteGroupAdjuster implements InviteGroupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapInviteGroupAdjuster implements InviteGroupAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class UtmSourceInviteGroupAdjuster implements InviteGroupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: InviteGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the invite group steps in order and keeps a trace of each. */
export class InviteGroupEngine {
  steps: InviteGroupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteGroupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InviteGroup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InviteGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInviteGroupEngine(): InviteGroupEngine {
  return new InviteGroupEngine(
    [
      new TieredInviteGroupAdjuster([2651, 3117, 6641, 7273], [1.19, 0.89, 0.97, 0.81]),
      new PercentInviteGroupAdjuster(-3.2),
      new RoundingInviteGroupAdjuster(0.5),
      new CapInviteGroupAdjuster(16423),
      new UtmSourceInviteGroupAdjuster(new Map<string, number>([["central", 0.77], ["south", 1.27]])),
    ],
    [],
    1.7,
    46698.4,
  );
}
