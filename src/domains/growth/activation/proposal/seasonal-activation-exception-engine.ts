import * as numbers from "../../../../kit/numbers.js";
import { SeasonalActivationException } from "./seasonal-activation-exception.js";

/** One step of the seasonal activation exception calculation. */
export interface SeasonalActivationExceptionModifier {
  describe(): string;
  adjust(item: SeasonalActivationException, value: number): number;
}

export class PercentSeasonalActivationExceptionAdjuster implements SeasonalActivationExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalActivationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalActivationExceptionEndsAtOffsetAdjuster implements SeasonalActivationExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: SeasonalActivationException, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class TitleSeasonalActivationExceptionAdjuster implements SeasonalActivationExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SeasonalActivationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSeasonalActivationExceptionAdjuster implements SeasonalActivationExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalActivationException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal activation exception steps in order and keeps a trace of each. */
export class SeasonalActivationExceptionEngine {
  steps: SeasonalActivationExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalActivationExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalActivationException): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: SeasonalActivationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalActivationExceptionEngine(): SeasonalActivationExceptionEngine {
  return new SeasonalActivationExceptionEngine(
    [
      new PercentSeasonalActivationExceptionAdjuster(-1.8),
      new SeasonalActivationExceptionEndsAtOffsetAdjuster(1.56),
      new TitleSeasonalActivationExceptionAdjuster(new Map<string, number>([["retail", 0.74]])),
      new RoundingSeasonalActivationExceptionAdjuster(1),
    ],
    [],
    0.7,
    8903,
  );
}
