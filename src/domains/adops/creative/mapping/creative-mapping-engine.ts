import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeMapping } from "./creative-mapping.js";

/** One step of the creative mapping calculation. */
export interface CreativeMappingFactor {
  describe(): string;
  adjust(item: CreativeMapping, value: number): number;
}

export class FlaggedCreativeMappingAdjuster implements CreativeMappingFactor {
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

  adjust(item: CreativeMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredCreativeMappingAdjuster implements CreativeMappingFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeMapping, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentCreativeMappingAdjuster implements CreativeMappingFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CreativeMappingWindowDaysOffsetAdjuster implements CreativeMappingFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: CreativeMapping, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingCreativeMappingAdjuster implements CreativeMappingFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CreativeMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the creative mapping steps in order and keeps a trace of each. */
export class CreativeMappingEngine {
  steps: CreativeMappingFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeMappingFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CreativeMapping): number {
    let current = item.netValue();
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

  evaluateAll(items: CreativeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCreativeMappingEngine(flagsValue: flags.Registry): CreativeMappingEngine {
  return new CreativeMappingEngine(
    [
      new FlaggedCreativeMappingAdjuster(flagsValue, "creative-mapping-pending", -9.8),
      new TieredCreativeMappingAdjuster([3620, 7108, 8724], [1.05, 0.99, 0.92]),
      new PercentCreativeMappingAdjuster(-1.3),
      new CreativeMappingWindowDaysOffsetAdjuster(1.79),
      new RoundingCreativeMappingAdjuster(0.5),
    ],
    [],
    3.3,
    76595.4,
  );
}
