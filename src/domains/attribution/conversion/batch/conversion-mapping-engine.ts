import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ConversionMapping } from "./conversion-mapping.js";

/** One step of the conversion mapping calculation. */
export interface ConversionMappingFactor {
  describe(): string;
  adjust(item: ConversionMapping, value: number): number;
}

export class CapConversionMappingAdjuster implements ConversionMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ConversionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredConversionMappingAdjuster implements ConversionMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ConversionMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedConversionMappingAdjuster implements ConversionMappingFactor {
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

  adjust(item: ConversionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingConversionMappingAdjuster implements ConversionMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ConversionMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class ChannelConversionMappingAdjuster implements ConversionMappingFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ConversionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ConversionMappingRevisionOffsetAdjuster implements ConversionMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: ConversionMapping, value: number): number {
    return value + item.revision * this.weight;
  }
}

/** Runs the conversion mapping steps in order and keeps a trace of each. */
export class ConversionMappingEngine {
  steps: ConversionMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ConversionMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ConversionMapping): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: ConversionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultConversionMappingEngine(flagsValue: flags.Registry): ConversionMappingEngine {
  return new ConversionMappingEngine(
    [
      new CapConversionMappingAdjuster(31418),
      new TieredConversionMappingAdjuster([1218, 3864, 6645, 8211], [1.04, 0.86, 1.11, 1.02]),
      new FlaggedConversionMappingAdjuster(flagsValue, "conversion-mapping-tiered", 3),
      new RoundingConversionMappingAdjuster(0.25),
      new ChannelConversionMappingAdjuster(
        new Map<string, number>([["retail", 0.86], ["online", 0.97], ["central", 0.78]]),
      ),
      new ConversionMappingRevisionOffsetAdjuster(0.93),
    ],
    [],
    0.8,
    73077.3,
  );
}
