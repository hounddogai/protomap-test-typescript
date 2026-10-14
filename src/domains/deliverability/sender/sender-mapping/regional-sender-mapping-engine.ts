import * as flags from "../../../../kit/flags.js";
import { RegionalSenderMapping } from "./regional-sender-mapping.js";

/** One step of the regional sender mapping calculation. */
export interface RegionalSenderMappingFactor {
  describe(): string;
  adjust(item: RegionalSenderMapping, value: number): number;
}

export class PercentRegionalSenderMappingAdjuster implements RegionalSenderMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalSenderMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RegionalSenderMappingMaximumOffsetAdjuster implements RegionalSenderMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: RegionalSenderMapping, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class MinimumRegionalSenderMappingAdjuster implements RegionalSenderMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalSenderMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalSenderMappingAdjuster implements RegionalSenderMappingFactor {
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

  adjust(item: RegionalSenderMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional sender mapping steps in order and keeps a trace of each. */
export class RegionalSenderMappingEngine {
  steps: RegionalSenderMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalSenderMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalSenderMapping): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: RegionalSenderMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalSenderMappingEngine(flagsValue: flags.Registry): RegionalSenderMappingEngine {
  return new RegionalSenderMappingEngine(
    [
      new PercentRegionalSenderMappingAdjuster(11.4),
      new RegionalSenderMappingMaximumOffsetAdjuster(0.54),
      new MinimumRegionalSenderMappingAdjuster(25.5),
      new FlaggedRegionalSenderMappingAdjuster(flagsValue, "regional-sender-mapping-seasonal", 6.4),
    ],
    [],
    1.7,
    37706,
  );
}
