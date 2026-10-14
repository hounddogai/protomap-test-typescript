import * as flags from "../../../../kit/flags.js";
import { CsatMapping } from "./csat-mapping.js";

/** One step of the csat mapping calculation. */
export interface CsatMappingStep {
  describe(): string;
  adjust(item: CsatMapping, value: number): number;
}

export class FlaggedCsatMappingAdjuster implements CsatMappingStep {
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

  adjust(item: CsatMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentCsatMappingAdjuster implements CsatMappingStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CsatMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CsatMappingBidOffsetAdjuster implements CsatMappingStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: CsatMapping, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapCsatMappingAdjuster implements CsatMappingStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CsatMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the csat mapping steps in order and keeps a trace of each. */
export class CsatMappingEngine {
  steps: CsatMappingStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CsatMappingStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CsatMapping): number {
    let current = item.projectedValue();
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

  evaluateAll(items: CsatMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCsatMappingEngine(flagsValue: flags.Registry): CsatMappingEngine {
  return new CsatMappingEngine(
    [
      new FlaggedCsatMappingAdjuster(flagsValue, "csat-mapping-scheduled", -3.1),
      new PercentCsatMappingAdjuster(0),
      new CsatMappingBidOffsetAdjuster(0.64),
      new CapCsatMappingAdjuster(13485),
    ],
    [],
    1.3,
    76234,
  );
}
