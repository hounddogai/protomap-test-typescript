import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryTierRecord } from "./primary-tier-record.js";

/** One step of the primary tier record calculation. */
export interface PrimaryTierRecordAdjuster {
  describe(): string;
  adjust(item: PrimaryTierRecord, value: number): number;
}

export class PercentPrimaryTierRecordAdjuster implements PrimaryTierRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryTierRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryTierRecordRevisionOffsetAdjuster implements PrimaryTierRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PrimaryTierRecord, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedPrimaryTierRecordAdjuster implements PrimaryTierRecordAdjuster {
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

  adjust(item: PrimaryTierRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryTierRecordAdjuster implements PrimaryTierRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryTierRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryPrimaryTierRecordAdjuster implements PrimaryTierRecordAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: PrimaryTierRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary tier record steps in order and keeps a trace of each. */
export class PrimaryTierRecordEngine {
  steps: PrimaryTierRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryTierRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryTierRecord): number {
    let current = item.netVolume();
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

  evaluateAll(items: PrimaryTierRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryTierRecordEngine(flagsValue: flags.Registry): PrimaryTierRecordEngine {
  return new PrimaryTierRecordEngine(
    [
      new PercentPrimaryTierRecordAdjuster(-3.7),
      new PrimaryTierRecordRevisionOffsetAdjuster(0.93),
      new FlaggedPrimaryTierRecordAdjuster(flagsValue, "primary-tier-record-regional", -6.1),
      new RoundingPrimaryTierRecordAdjuster(5),
      new CountryPrimaryTierRecordAdjuster(
        new Map<string, number>([["south", 1.3], ["west", 1.14], ["retail", 1.04]]),
      ),
    ],
    [],
    0.9,
    90950.8,
  );
}
