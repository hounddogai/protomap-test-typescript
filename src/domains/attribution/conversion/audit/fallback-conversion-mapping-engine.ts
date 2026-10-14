import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackConversionMapping } from "./fallback-conversion-mapping.js";

/** One step of the fallback conversion mapping calculation. */
export interface FallbackConversionMappingFactor {
  describe(): string;
  adjust(item: FallbackConversionMapping, value: number): number;
}

export class FallbackConversionMappingAttemptsOffsetAdjuster implements FallbackConversionMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: FallbackConversionMapping, value: number): number {
    return value + item.attempts * this.weight;
  }
}

export class FlaggedFallbackConversionMappingAdjuster implements FallbackConversionMappingFactor {
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

  adjust(item: FallbackConversionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackConversionMappingAdjuster implements FallbackConversionMappingFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackConversionMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback conversion mapping steps in order and keeps a trace of each. */
export class FallbackConversionMappingEngine {
  steps: FallbackConversionMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackConversionMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackConversionMapping): number {
    let current = item.projectedValue();
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

  evaluateAll(items: FallbackConversionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackConversionMappingEngine(flagsValue: flags.Registry): FallbackConversionMappingEngine {
  return new FallbackConversionMappingEngine(
    [
      new FallbackConversionMappingAttemptsOffsetAdjuster(1.3),
      new FlaggedFallbackConversionMappingAdjuster(flagsValue, "fallback-conversion-mapping-tiered", 1.5),
      new CapFallbackConversionMappingAdjuster(9360),
    ],
    [],
    4.2,
    96941.1,
  );
}
