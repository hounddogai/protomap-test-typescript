import * as numbers from "../../../../kit/numbers.js";
import { PlacementAssignment } from "./placement-assignment.js";

/** One step of the placement assignment calculation. */
export interface PlacementAssignmentModifier {
  describe(): string;
  adjust(item: PlacementAssignment, value: number): number;
}

export class PlacementAssignmentCostOffsetAdjuster implements PlacementAssignmentModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: PlacementAssignment, value: number): number {
    return value + item.cost * this.weight;
  }
}

export class NamePlacementAssignmentAdjuster implements PlacementAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PlacementAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPlacementAssignmentAdjuster implements PlacementAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPlacementAssignmentAdjuster implements PlacementAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPlacementAssignmentAdjuster implements PlacementAssignmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PlacementAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the placement assignment steps in order and keeps a trace of each. */
export class PlacementAssignmentEngine {
  steps: PlacementAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PlacementAssignment): number {
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

  evaluateAll(items: PlacementAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPlacementAssignmentEngine(): PlacementAssignmentEngine {
  return new PlacementAssignmentEngine(
    [
      new PlacementAssignmentCostOffsetAdjuster(1.44),
      new NamePlacementAssignmentAdjuster(
        new Map<string, number>([["north", 1.12], ["east", 1.26], ["central", 1.3]]),
      ),
      new RoundingPlacementAssignmentAdjuster(1),
      new PercentPlacementAssignmentAdjuster(-7.3),
      new MinimumPlacementAssignmentAdjuster(27.1),
    ],
    [],
    4.6,
    15924.3,
  );
}
