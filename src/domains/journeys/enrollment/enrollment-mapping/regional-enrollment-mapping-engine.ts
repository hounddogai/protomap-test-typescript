import * as flags from "../../../../kit/flags.js";
import { RegionalEnrollmentMapping } from "./regional-enrollment-mapping.js";

/** One step of the regional enrollment mapping calculation. */
export interface RegionalEnrollmentMappingFactor {
  describe(): string;
  adjust(item: RegionalEnrollmentMapping, value: number): number;
}

export class MinimumRegionalEnrollmentMappingAdjuster implements RegionalEnrollmentMappingFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalEnrollmentMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRegionalEnrollmentMappingAdjuster implements RegionalEnrollmentMappingFactor {
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

  adjust(item: RegionalEnrollmentMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalEnrollmentMappingAmountOffsetAdjuster implements RegionalEnrollmentMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RegionalEnrollmentMapping, value: number): number {
    return value + item.amount * this.weight;
  }
}

/** Runs the regional enrollment mapping steps in order and keeps a trace of each. */
export class RegionalEnrollmentMappingEngine {
  steps: RegionalEnrollmentMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalEnrollmentMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalEnrollmentMapping): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RegionalEnrollmentMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalEnrollmentMappingEngine(flagsValue: flags.Registry): RegionalEnrollmentMappingEngine {
  return new RegionalEnrollmentMappingEngine(
    [
      new MinimumRegionalEnrollmentMappingAdjuster(4.2),
      new FlaggedRegionalEnrollmentMappingAdjuster(flagsValue, "regional-enrollment-mapping-primary", 5.6),
      new RegionalEnrollmentMappingAmountOffsetAdjuster(0.38),
    ],
    [],
    2.5,
    5862.6,
  );
}
