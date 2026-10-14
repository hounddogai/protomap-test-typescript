import * as numbers from "../../../../kit/numbers.js";
import { SeasonalBadgeProfile } from "./seasonal-badge-profile.js";

/** One step of the seasonal badge profile calculation. */
export interface SeasonalBadgeProfileAdjuster {
  describe(): string;
  adjust(item: SeasonalBadgeProfile, value: number): number;
}

export class SeasonalBadgeProfileSendAtOffsetAdjuster implements SeasonalBadgeProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: SeasonalBadgeProfile, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class MinimumSeasonalBadgeProfileAdjuster implements SeasonalBadgeProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalBadgeProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSeasonalBadgeProfileAdjuster implements SeasonalBadgeProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalBadgeProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal badge profile steps in order and keeps a trace of each. */
export class SeasonalBadgeProfileEngine {
  steps: SeasonalBadgeProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalBadgeProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalBadgeProfile): number {
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

  evaluateAll(items: SeasonalBadgeProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalBadgeProfileEngine(): SeasonalBadgeProfileEngine {
  return new SeasonalBadgeProfileEngine(
    [
      new SeasonalBadgeProfileSendAtOffsetAdjuster(1.03),
      new MinimumSeasonalBadgeProfileAdjuster(13.2),
      new RoundingSeasonalBadgeProfileAdjuster(1),
    ],
    [],
    1,
    95190.3,
  );
}
