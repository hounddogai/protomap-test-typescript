import * as flags from "../../../../kit/flags.js";
import { TieredApprovalForecast } from "./tiered-approval-forecast.js";

/** One step of the tiered approval forecast calculation. */
export interface TieredApprovalForecastModifier {
  describe(): string;
  adjust(item: TieredApprovalForecast, value: number): number;
}

export class MinimumTieredApprovalForecastAdjuster implements TieredApprovalForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredApprovalForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapTieredApprovalForecastAdjuster implements TieredApprovalForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredApprovalForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedTieredApprovalForecastAdjuster implements TieredApprovalForecastModifier {
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

  adjust(item: TieredApprovalForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredApprovalForecastImpressionsOffsetAdjuster implements TieredApprovalForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: TieredApprovalForecast, value: number): number {
    return value + item.impressions * this.weight;
  }
}

/** Runs the tiered approval forecast steps in order and keeps a trace of each. */
export class TieredApprovalForecastEngine {
  steps: TieredApprovalForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredApprovalForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredApprovalForecast): number {
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

  evaluateAll(items: TieredApprovalForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredApprovalForecastEngine(flagsValue: flags.Registry): TieredApprovalForecastEngine {
  return new TieredApprovalForecastEngine(
    [
      new MinimumTieredApprovalForecastAdjuster(33.6),
      new CapTieredApprovalForecastAdjuster(20209),
      new FlaggedTieredApprovalForecastAdjuster(flagsValue, "tiered-approval-forecast-primary", -0.3),
      new TieredApprovalForecastImpressionsOffsetAdjuster(0.27),
    ],
    [],
    2.7,
    18777.2,
  );
}
