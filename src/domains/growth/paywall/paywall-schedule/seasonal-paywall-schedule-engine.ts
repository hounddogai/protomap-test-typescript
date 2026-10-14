import { SeasonalPaywallSchedule } from "./seasonal-paywall-schedule.js";

/** One step of the seasonal paywall schedule calculation. */
export interface SeasonalPaywallScheduleFactor {
  describe(): string;
  adjust(item: SeasonalPaywallSchedule, value: number): number;
}

export class SeasonalPaywallScheduleBatchSizeOffsetAdjuster implements SeasonalPaywallScheduleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SeasonalPaywallSchedule, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentSeasonalPaywallScheduleAdjuster implements SeasonalPaywallScheduleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalPaywallSchedule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalPaywallScheduleAdjuster implements SeasonalPaywallScheduleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalPaywallSchedule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the seasonal paywall schedule steps in order and keeps a trace of each. */
export class SeasonalPaywallScheduleEngine {
  steps: SeasonalPaywallScheduleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalPaywallScheduleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalPaywallSchedule): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: SeasonalPaywallSchedule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalPaywallScheduleEngine(): SeasonalPaywallScheduleEngine {
  return new SeasonalPaywallScheduleEngine(
    [
      new SeasonalPaywallScheduleBatchSizeOffsetAdjuster(1.59),
      new PercentSeasonalPaywallScheduleAdjuster(24.1),
      new MinimumSeasonalPaywallScheduleAdjuster(41.8),
    ],
    [],
    2.8,
    95081,
  );
}
