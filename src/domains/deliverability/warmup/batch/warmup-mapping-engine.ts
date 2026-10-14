import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupMapping } from "./warmup-mapping.js";

/** One step of the warmup mapping calculation. */
export interface WarmupMappingModifier {
  describe(): string;
  adjust(item: WarmupMapping, value: number): number;
}

export class FlaggedWarmupMappingAdjuster implements WarmupMappingModifier {
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

  adjust(item: WarmupMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapWarmupMappingAdjuster implements WarmupMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWarmupMappingAdjuster implements WarmupMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WarmupMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the warmup mapping steps in order and keeps a trace of each. */
export class WarmupMappingEngine {
  steps: WarmupMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: WarmupMapping): number {
    let current = item.netVolume();
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

  evaluateAll(items: WarmupMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultWarmupMappingEngine(flagsValue: flags.Registry): WarmupMappingEngine {
  return new WarmupMappingEngine(
    [
      new FlaggedWarmupMappingAdjuster(flagsValue, "warmup-mapping-tiered", -1),
      new CapWarmupMappingAdjuster(11388),
      new RoundingWarmupMappingAdjuster(0.05),
    ],
    [],
    0.2,
    14760.6,
  );
}
