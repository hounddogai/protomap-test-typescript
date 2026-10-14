import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingJourneyRollup } from "./pending-journey-rollup.js";

/** One step of the pending journey rollup calculation. */
export interface PendingJourneyRollupAdjuster {
  describe(): string;
  adjust(item: PendingJourneyRollup, value: number): number;
}

export class FlaggedPendingJourneyRollupAdjuster implements PendingJourneyRollupAdjuster {
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

  adjust(item: PendingJourneyRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitPendingJourneyRollupAdjuster implements PendingJourneyRollupAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PendingJourneyRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingJourneyRollupStartsAtOffsetAdjuster implements PendingJourneyRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus starts at times ${this.weight}`;
  }

  adjust(item: PendingJourneyRollup, value: number): number {
    return value + item.startsAt * this.weight;
  }
}

export class PercentPendingJourneyRollupAdjuster implements PendingJourneyRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingJourneyRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPendingJourneyRollupAdjuster implements PendingJourneyRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingJourneyRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending journey rollup steps in order and keeps a trace of each. */
export class PendingJourneyRollupEngine {
  steps: PendingJourneyRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingJourneyRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingJourneyRollup): number {
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

  evaluateAll(items: PendingJourneyRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingJourneyRollupEngine(flagsValue: flags.Registry): PendingJourneyRollupEngine {
  return new PendingJourneyRollupEngine(
    [
      new FlaggedPendingJourneyRollupAdjuster(flagsValue, "pending-journey-rollup-lenient", -3.7),
      new UnitPendingJourneyRollupAdjuster(new Map<string, number>([["online", 0.97], ["north", 0.94]])),
      new PendingJourneyRollupStartsAtOffsetAdjuster(1.72),
      new PercentPendingJourneyRollupAdjuster(-15.8),
      new RoundingPendingJourneyRollupAdjuster(0.1),
    ],
    [],
    1,
    2011.9,
  );
}
