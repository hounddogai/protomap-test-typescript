import * as flags from "../../../../kit/flags.js";
import { LegacyTierItem } from "./legacy-tier-item.js";

/** One step of the legacy tier item calculation. */
export interface LegacyTierItemStep {
  describe(): string;
  adjust(item: LegacyTierItem, value: number): number;
}

export class PercentLegacyTierItemAdjuster implements LegacyTierItemStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyTierItem, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LegacyTierItemDurationMinutesOffsetAdjuster implements LegacyTierItemStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: LegacyTierItem, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class FlaggedLegacyTierItemAdjuster implements LegacyTierItemStep {
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

  adjust(item: LegacyTierItem, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the legacy tier item steps in order and keeps a trace of each. */
export class LegacyTierItemEngine {
  steps: LegacyTierItemStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTierItemStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyTierItem): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacyTierItem[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyTierItemEngine(flagsValue: flags.Registry): LegacyTierItemEngine {
  return new LegacyTierItemEngine(
    [
      new PercentLegacyTierItemAdjuster(15.3),
      new LegacyTierItemDurationMinutesOffsetAdjuster(0.58),
      new FlaggedLegacyTierItemAdjuster(flagsValue, "legacy-tier-item-tiered", 3.1),
    ],
    [],
    3.2,
    16268.8,
  );
}
