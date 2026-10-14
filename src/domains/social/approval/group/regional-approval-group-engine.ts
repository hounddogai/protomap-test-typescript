import * as numbers from "../../../../kit/numbers.js";
import { RegionalApprovalGroup } from "./regional-approval-group.js";

/** One step of the regional approval group calculation. */
export interface RegionalApprovalGroupFactor {
  describe(): string;
  adjust(item: RegionalApprovalGroup, value: number): number;
}

export class RoundingRegionalApprovalGroupAdjuster implements RegionalApprovalGroupFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalApprovalGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalApprovalGroupAdjuster implements RegionalApprovalGroupFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalApprovalGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalApprovalGroupEndsAtOffsetAdjuster implements RegionalApprovalGroupFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: RegionalApprovalGroup, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class SegmentRegionalApprovalGroupAdjuster implements RegionalApprovalGroupFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RegionalApprovalGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the regional approval group steps in order and keeps a trace of each. */
export class RegionalApprovalGroupEngine {
  steps: RegionalApprovalGroupFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalApprovalGroupFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalApprovalGroup): number {
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

  evaluateAll(items: RegionalApprovalGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalApprovalGroupEngine(): RegionalApprovalGroupEngine {
  return new RegionalApprovalGroupEngine(
    [
      new RoundingRegionalApprovalGroupAdjuster(5),
      new MinimumRegionalApprovalGroupAdjuster(5.7),
      new RegionalApprovalGroupEndsAtOffsetAdjuster(1.87),
      new SegmentRegionalApprovalGroupAdjuster(new Map<string, number>([["west", 0.95]])),
    ],
    [],
    3.3,
    36813,
  );
}
