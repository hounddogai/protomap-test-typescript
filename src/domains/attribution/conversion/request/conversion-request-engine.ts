import * as flags from "../../../../kit/flags.js";
import { ConversionRequest } from "./conversion-request.js";

/** One step of the conversion request calculation. */
export interface ConversionRequestFactor {
  describe(): string;
  adjust(item: ConversionRequest, value: number): number;
}

export class ConversionRequestFrequencyCapOffsetAdjuster implements ConversionRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: ConversionRequest, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapConversionRequestAdjuster implements ConversionRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentConversionRequestAdjuster implements ConversionRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ConversionRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedConversionRequestAdjuster implements ConversionRequestFactor {
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

  adjust(item: ConversionRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the conversion request steps in order and keeps a trace of each. */
export class ConversionRequestEngine {
  steps: ConversionRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ConversionRequest): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: ConversionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultConversionRequestEngine(flagsValue: flags.Registry): ConversionRequestEngine {
  return new ConversionRequestEngine(
    [
      new ConversionRequestFrequencyCapOffsetAdjuster(1.22),
      new CapConversionRequestAdjuster(4813),
      new PercentConversionRequestAdjuster(-15.8),
      new FlaggedConversionRequestAdjuster(flagsValue, "conversion-request-primary", 0),
    ],
    [],
    0.5,
    51839.9,
  );
}
