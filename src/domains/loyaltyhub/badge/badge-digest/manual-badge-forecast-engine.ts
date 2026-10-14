import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualBadgeForecast } from "./manual-badge-forecast.js";

/** One step of the manual badge forecast calculation. */
export interface ManualBadgeForecastModifier {
  describe(): string;
  adjust(item: ManualBadgeForecast, value: number): number;
}

export class CapManualBadgeForecastAdjuster implements ManualBadgeForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualBadgeForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedManualBadgeForecastAdjuster implements ManualBadgeForecastModifier {
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

  adjust(item: ManualBadgeForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualBadgeForecastAdjuster implements ManualBadgeForecastModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualBadgeForecast, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelManualBadgeForecastAdjuster implements ManualBadgeForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ManualBadgeForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualBadgeForecastAdjuster implements ManualBadgeForecastModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualBadgeForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual badge forecast steps in order and keeps a trace of each. */
export class ManualBadgeForecastEngine {
  steps: ManualBadgeForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualBadgeForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualBadgeForecast): number {
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

  evaluateAll(items: ManualBadgeForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualBadgeForecastEngine(flagsValue: flags.Registry): ManualBadgeForecastEngine {
  return new ManualBadgeForecastEngine(
    [
      new CapManualBadgeForecastAdjuster(30187),
      new FlaggedManualBadgeForecastAdjuster(flagsValue, "manual-badge-forecast-tiered", 9),
      new TieredManualBadgeForecastAdjuster([1162, 6760, 9681], [1.14, 0.92, 1.18]),
      new ChannelManualBadgeForecastAdjuster(new Map<string, number>([["north", 1.05], ["online", 1.22]])),
      new PercentManualBadgeForecastAdjuster(-14),
    ],
    [],
    3.3,
    76016.7,
  );
}
