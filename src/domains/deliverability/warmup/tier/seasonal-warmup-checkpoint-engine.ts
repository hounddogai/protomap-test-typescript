import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalWarmupCheckpoint } from "./seasonal-warmup-checkpoint.js";

/** One step of the seasonal warmup checkpoint calculation. */
export interface SeasonalWarmupCheckpointFactor {
  describe(): string;
  adjust(item: SeasonalWarmupCheckpoint, value: number): number;
}

export class RoundingSeasonalWarmupCheckpointAdjuster implements SeasonalWarmupCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalWarmupCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalWarmupCheckpointAdjuster implements SeasonalWarmupCheckpointFactor {
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

  adjust(item: SeasonalWarmupCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LocaleSeasonalWarmupCheckpointAdjuster implements SeasonalWarmupCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SeasonalWarmupCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentSeasonalWarmupCheckpointAdjuster implements SeasonalWarmupCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalWarmupCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal warmup checkpoint steps in order and keeps a trace of each. */
export class SeasonalWarmupCheckpointEngine {
  steps: SeasonalWarmupCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalWarmupCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SeasonalWarmupCheckpoint): number {
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

  evaluateAll(items: SeasonalWarmupCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSeasonalWarmupCheckpointEngine(flagsValue: flags.Registry): SeasonalWarmupCheckpointEngine {
  return new SeasonalWarmupCheckpointEngine(
    [
      new RoundingSeasonalWarmupCheckpointAdjuster(0.05),
      new FlaggedSeasonalWarmupCheckpointAdjuster(flagsValue, "seasonal-warmup-checkpoint-tiered", -4.9),
      new LocaleSeasonalWarmupCheckpointAdjuster(new Map<string, number>([["online", 0.87], ["central", 1.12]])),
      new PercentSeasonalWarmupCheckpointAdjuster(-20.9),
    ],
    [],
    4,
    31047.6,
  );
}
