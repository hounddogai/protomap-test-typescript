import * as numbers from "../../../../kit/numbers.js";
import { LegacyCreativeTarget } from "./legacy-creative-target.js";

/** One step of the legacy creative target calculation. */
export interface LegacyCreativeTargetModifier {
  describe(): string;
  adjust(item: LegacyCreativeTarget, value: number): number;
}

export class PercentLegacyCreativeTargetAdjuster implements LegacyCreativeTargetModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyCreativeTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyCreativeTargetAdjuster implements LegacyCreativeTargetModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyCreativeTarget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleLegacyCreativeTargetAdjuster implements LegacyCreativeTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: LegacyCreativeTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy creative target steps in order and keeps a trace of each. */
export class LegacyCreativeTargetEngine {
  steps: LegacyCreativeTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyCreativeTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyCreativeTarget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: LegacyCreativeTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyCreativeTargetEngine(): LegacyCreativeTargetEngine {
  return new LegacyCreativeTargetEngine(
    [
      new PercentLegacyCreativeTargetAdjuster(-20.3),
      new RoundingLegacyCreativeTargetAdjuster(0.5),
      new TitleLegacyCreativeTargetAdjuster(
        new Map<string, number>([["online", 1.1], ["south", 0.92], ["retail", 0.88]]),
      ),
    ],
    [],
    4.9,
    9710.6,
  );
}
