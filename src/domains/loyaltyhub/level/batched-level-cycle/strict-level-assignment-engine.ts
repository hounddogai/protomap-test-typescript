import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictLevelAssignment } from "./strict-level-assignment.js";

/** One step of the strict level assignment calculation. */
export interface StrictLevelAssignmentModifier {
  describe(): string;
  adjust(item: StrictLevelAssignment, value: number): number;
}

export class TieredStrictLevelAssignmentAdjuster implements StrictLevelAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictLevelAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictLevelAssignmentAdjuster implements StrictLevelAssignmentModifier {
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

  adjust(item: StrictLevelAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleStrictLevelAssignmentAdjuster implements StrictLevelAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictLevelAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapStrictLevelAssignmentAdjuster implements StrictLevelAssignmentModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictLevelAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictLevelAssignmentAdjuster implements StrictLevelAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictLevelAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict level assignment steps in order and keeps a trace of each. */
export class StrictLevelAssignmentEngine {
  steps: StrictLevelAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictLevelAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: StrictLevelAssignment): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: StrictLevelAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultStrictLevelAssignmentEngine(flagsValue: flags.Registry): StrictLevelAssignmentEngine {
  return new StrictLevelAssignmentEngine(
    [
      new TieredStrictLevelAssignmentAdjuster([6735, 7881, 8166], [1.12, 1.05, 1.09]),
      new FlaggedStrictLevelAssignmentAdjuster(flagsValue, "strict-level-assignment-pending", -7.3),
      new TitleStrictLevelAssignmentAdjuster(new Map<string, number>([["east", 0.81]])),
      new CapStrictLevelAssignmentAdjuster(45662),
      new PercentStrictLevelAssignmentAdjuster(19.8),
    ],
    [],
    0.5,
    13162.4,
  );
}
