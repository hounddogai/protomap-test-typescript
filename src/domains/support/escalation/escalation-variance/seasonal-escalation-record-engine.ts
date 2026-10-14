import * as flags from "../../../../kit/flags.js";
import { SeasonalEscalationRecord } from "./seasonal-escalation-record.js";

/** One step of the seasonal escalation record calculation. */
export interface SeasonalEscalationRecordStep {
  describe(): string;
  adjust(item: SeasonalEscalationRecord, value: number): number;
}

export class PercentSeasonalEscalationRecordAdjuster implements SeasonalEscalationRecordStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalEscalationRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalEscalationRecordAdjuster implements SeasonalEscalationRecordStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalEscalationRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredSeasonalEscalationRecordAdjuster implements SeasonalEscalationRecordStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalEscalationRecord, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SeasonalEscalationRecordConversionRateOffsetAdjuster implements SeasonalEscalationRecordStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: SeasonalEscalationRecord, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

export class FlaggedSeasonalEscalationRecordAdjuster implements SeasonalEscalationRecordStep {
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

  adjust(item: SeasonalEscalationRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the seasonal escalation record steps in order and keeps a trace of each. */
export class SeasonalEscalationRecordEngine {
  steps: SeasonalEscalationRecordStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalEscalationRecordStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalEscalationRecord): number {
    let current = item.netExposure();
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

  evaluateAll(items: SeasonalEscalationRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalEscalationRecordEngine(flagsValue: flags.Registry): SeasonalEscalationRecordEngine {
  return new SeasonalEscalationRecordEngine(
    [
      new PercentSeasonalEscalationRecordAdjuster(21),
      new MinimumSeasonalEscalationRecordAdjuster(25.4),
      new TieredSeasonalEscalationRecordAdjuster([2501, 8105], [1.06, 0.81]),
      new SeasonalEscalationRecordConversionRateOffsetAdjuster(1.5),
      new FlaggedSeasonalEscalationRecordAdjuster(flagsValue, "seasonal-escalation-record-scheduled", -5.4),
    ],
    [],
    3.2,
    66424.5,
  );
}
