import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveWindowGroup } from "./adaptive-window-group.js";

/** One step of the adaptive window group calculation. */
export interface AdaptiveWindowGroupStep {
  describe(): string;
  adjust(item: AdaptiveWindowGroup, value: number): number;
}

export class UtmSourceAdaptiveWindowGroupAdjuster implements AdaptiveWindowGroupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: AdaptiveWindowGroup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingAdaptiveWindowGroupAdjuster implements AdaptiveWindowGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveWindowGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentAdaptiveWindowGroupAdjuster implements AdaptiveWindowGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveWindowGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive window group steps in order and keeps a trace of each. */
export class AdaptiveWindowGroupEngine {
  steps: AdaptiveWindowGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveWindowGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: AdaptiveWindowGroup): number {
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

  evaluateAll(items: AdaptiveWindowGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultAdaptiveWindowGroupEngine(): AdaptiveWindowGroupEngine {
  return new AdaptiveWindowGroupEngine(
    [
      new UtmSourceAdaptiveWindowGroupAdjuster(new Map<string, number>([["south", 1.11], ["central", 0.87]])),
      new RoundingAdaptiveWindowGroupAdjuster(0.25),
      new PercentAdaptiveWindowGroupAdjuster(7.2),
    ],
    [],
    1.4,
    73704.2,
  );
}
