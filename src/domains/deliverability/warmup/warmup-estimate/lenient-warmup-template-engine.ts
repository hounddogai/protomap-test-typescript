import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientWarmupTemplate } from "./lenient-warmup-template.js";

/** One step of the lenient warmup template calculation. */
export interface LenientWarmupTemplateAdjuster {
  describe(): string;
  adjust(item: LenientWarmupTemplate, value: number): number;
}

export class CapLenientWarmupTemplateAdjuster implements LenientWarmupTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientWarmupTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLenientWarmupTemplateAdjuster implements LenientWarmupTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientWarmupTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLenientWarmupTemplateAdjuster implements LenientWarmupTemplateAdjuster {
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

  adjust(item: LenientWarmupTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLenientWarmupTemplateAdjuster implements LenientWarmupTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientWarmupTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LenientWarmupTemplateWindowDaysOffsetAdjuster implements LenientWarmupTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: LenientWarmupTemplate, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class RoundingLenientWarmupTemplateAdjuster implements LenientWarmupTemplateAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientWarmupTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the lenient warmup template steps in order and keeps a trace of each. */
export class LenientWarmupTemplateEngine {
  steps: LenientWarmupTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientWarmupTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LenientWarmupTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientWarmupTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLenientWarmupTemplateEngine(flagsValue: flags.Registry): LenientWarmupTemplateEngine {
  return new LenientWarmupTemplateEngine(
    [
      new CapLenientWarmupTemplateAdjuster(41198),
      new TieredLenientWarmupTemplateAdjuster([3865, 7546, 8580], [1.12, 0.93, 1]),
      new FlaggedLenientWarmupTemplateAdjuster(flagsValue, "lenient-warmup-template-regional", 6.4),
      new PercentLenientWarmupTemplateAdjuster(21),
      new LenientWarmupTemplateWindowDaysOffsetAdjuster(1.08),
      new RoundingLenientWarmupTemplateAdjuster(5),
    ],
    [],
    0.9,
    87031.7,
  );
}
