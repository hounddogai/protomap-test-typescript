import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

/** One step of the weighted deflection assignment calculation. */
export interface WeightedDeflectionAssignmentModifier {
  describe(): string;
  adjust(item: WeightedDeflectionAssignment, value: number): number;
}

export class LabelWeightedDeflectionAssignmentAdjuster implements WeightedDeflectionAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: WeightedDeflectionAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedDeflectionAssignmentAdjuster implements WeightedDeflectionAssignmentModifier {
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

  adjust(item: WeightedDeflectionAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingWeightedDeflectionAssignmentAdjuster implements WeightedDeflectionAssignmentModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedDeflectionAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the weighted deflection assignment steps in order and keeps a trace of each. */
export class WeightedDeflectionAssignmentEngine {
  steps: WeightedDeflectionAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedDeflectionAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WeightedDeflectionAssignment): number {
    let current = item.netExposure();
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

  evaluateAll(items: WeightedDeflectionAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWeightedDeflectionAssignmentEngine(flagsValue: flags.Registry): WeightedDeflectionAssignmentEngine {
  return new WeightedDeflectionAssignmentEngine(
    [
      new LabelWeightedDeflectionAssignmentAdjuster(
        new Map<string, number>([["online", 1.32], ["retail", 0.84]]),
      ),
      new FlaggedWeightedDeflectionAssignmentAdjuster(flagsValue, "weighted-deflection-assignment-lenient", 9.5),
      new RoundingWeightedDeflectionAssignmentAdjuster(0.05),
    ],
    [],
    4.6,
    45076.3,
  );
}
