import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredComplaintOverride } from "./tiered-complaint-override.js";

/** One step of the tiered complaint override calculation. */
export interface TieredComplaintOverrideStep {
  describe(): string;
  adjust(item: TieredComplaintOverride, value: number): number;
}

export class FlaggedTieredComplaintOverrideAdjuster implements TieredComplaintOverrideStep {
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

  adjust(item: TieredComplaintOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapTieredComplaintOverrideAdjuster implements TieredComplaintOverrideStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredComplaintOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredTieredComplaintOverrideAdjuster implements TieredComplaintOverrideStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredComplaintOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LocaleTieredComplaintOverrideAdjuster implements TieredComplaintOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TieredComplaintOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredComplaintOverrideConversionRateOffsetAdjuster implements TieredComplaintOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus conversion rate times ${this.weight}`;
  }

  adjust(item: TieredComplaintOverride, value: number): number {
    return value + item.conversionRate * this.weight;
  }
}

/** Runs the tiered complaint override steps in order and keeps a trace of each. */
export class TieredComplaintOverrideEngine {
  steps: TieredComplaintOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredComplaintOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredComplaintOverride): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: TieredComplaintOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredComplaintOverrideEngine(flagsValue: flags.Registry): TieredComplaintOverrideEngine {
  return new TieredComplaintOverrideEngine(
    [
      new FlaggedTieredComplaintOverrideAdjuster(flagsValue, "tiered-complaint-override-global", 7),
      new CapTieredComplaintOverrideAdjuster(17294),
      new TieredTieredComplaintOverrideAdjuster([3743, 7402, 9442], [0.93, 1.01, 1.01]),
      new LocaleTieredComplaintOverrideAdjuster(new Map<string, number>([["retail", 0.89]])),
      new TieredComplaintOverrideConversionRateOffsetAdjuster(0.53),
    ],
    [],
    2.4,
    30637.1,
  );
}
