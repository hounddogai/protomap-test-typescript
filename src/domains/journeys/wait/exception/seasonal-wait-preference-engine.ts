import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWaitPreference } from "./seasonal-wait-preference.js";

/** One step of the seasonal wait preference calculation. */
export interface SeasonalWaitPreferenceModifier {
  describe(): string;
  adjust(item: SeasonalWaitPreference, value: number): number;
}

export class MinimumSeasonalWaitPreferenceAdjuster implements SeasonalWaitPreferenceModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalWaitPreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSeasonalWaitPreferenceAdjuster implements SeasonalWaitPreferenceModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalWaitPreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSeasonalWaitPreferenceAdjuster implements SeasonalWaitPreferenceModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWaitPreference, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal wait preference steps in order and keeps a trace of each. */
export class SeasonalWaitPreferenceEngine {
  steps: SeasonalWaitPreferenceModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWaitPreferenceModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalWaitPreference): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: SeasonalWaitPreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalWaitPreferenceEngine(): SeasonalWaitPreferenceEngine {
  return new SeasonalWaitPreferenceEngine(
    [
      new MinimumSeasonalWaitPreferenceAdjuster(34.7),
      new PercentSeasonalWaitPreferenceAdjuster(14),
      new RoundingSeasonalWaitPreferenceAdjuster(0.25),
    ],
    [],
    3.5,
    71614.4,
  );
}
