import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DomainAssignment } from "./domain-assignment.js";

/** One step of the domain assignment calculation. */
export interface DomainAssignmentFactor {
  describe(): string;
  adjust(item: DomainAssignment, value: number): number;
}

export class PercentDomainAssignmentAdjuster implements DomainAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredDomainAssignmentAdjuster implements DomainAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DomainAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelDomainAssignmentAdjuster implements DomainAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DomainAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DomainAssignmentWeightOffsetAdjuster implements DomainAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: DomainAssignment, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedDomainAssignmentAdjuster implements DomainAssignmentFactor {
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

  adjust(item: DomainAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the domain assignment steps in order and keeps a trace of each. */
export class DomainAssignmentEngine {
  steps: DomainAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DomainAssignment): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: DomainAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDomainAssignmentEngine(flagsValue: flags.Registry): DomainAssignmentEngine {
  return new DomainAssignmentEngine(
    [
      new PercentDomainAssignmentAdjuster(-4.6),
      new TieredDomainAssignmentAdjuster([4553, 5413, 5992, 6607], [1.07, 1.11, 1.19, 0.89]),
      new LabelDomainAssignmentAdjuster(new Map<string, number>([["online", 1.23]])),
      new DomainAssignmentWeightOffsetAdjuster(1.69),
      new FlaggedDomainAssignmentAdjuster(flagsValue, "domain-assignment-pending", -9.7),
    ],
    [],
    3,
    93299.3,
  );
}
