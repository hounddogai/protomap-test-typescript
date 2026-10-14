import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTouchpointAssignment } from "./primary-touchpoint-assignment.js";

/** One step of the primary touchpoint assignment calculation. */
export interface PrimaryTouchpointAssignmentAdjuster {
  describe(): string;
  adjust(item: PrimaryTouchpointAssignment, value: number): number;
}

export class RoundingPrimaryTouchpointAssignmentAdjuster implements PrimaryTouchpointAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryTouchpointAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PrimaryTouchpointAssignmentFrequencyCapOffsetAdjuster implements PrimaryTouchpointAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: PrimaryTouchpointAssignment, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class TieredPrimaryTouchpointAssignmentAdjuster implements PrimaryTouchpointAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryTouchpointAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NamePrimaryTouchpointAssignmentAdjuster implements PrimaryTouchpointAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PrimaryTouchpointAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary touchpoint assignment steps in order and keeps a trace of each. */
export class PrimaryTouchpointAssignmentEngine {
  steps: PrimaryTouchpointAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTouchpointAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PrimaryTouchpointAssignment): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PrimaryTouchpointAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPrimaryTouchpointAssignmentEngine(): PrimaryTouchpointAssignmentEngine {
  return new PrimaryTouchpointAssignmentEngine(
    [
      new RoundingPrimaryTouchpointAssignmentAdjuster(0.05),
      new PrimaryTouchpointAssignmentFrequencyCapOffsetAdjuster(0.75),
      new TieredPrimaryTouchpointAssignmentAdjuster([5384, 7824], [0.97, 1.2]),
      new NamePrimaryTouchpointAssignmentAdjuster(
        new Map<string, number>([["south", 1.22], ["east", 0.99], ["west", 1.21]]),
      ),
    ],
    [],
    2,
    13695.1,
  );
}
