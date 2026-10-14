import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

/** One step of the manual ticket view estimate calculation. */
export interface ManualTicketViewEstimateStep {
  describe(): string;
  adjust(item: ManualTicketViewEstimate, value: number): number;
}

export class RegionManualTicketViewEstimateAdjuster implements ManualTicketViewEstimateStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: ManualTicketViewEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapManualTicketViewEstimateAdjuster implements ManualTicketViewEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualTicketViewEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ManualTicketViewEstimateDurationMinutesOffsetAdjuster implements ManualTicketViewEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: ManualTicketViewEstimate, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class TieredManualTicketViewEstimateAdjuster implements ManualTicketViewEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualTicketViewEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedManualTicketViewEstimateAdjuster implements ManualTicketViewEstimateStep {
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

  adjust(item: ManualTicketViewEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentManualTicketViewEstimateAdjuster implements ManualTicketViewEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTicketViewEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual ticket view estimate steps in order and keeps a trace of each. */
export class ManualTicketViewEstimateEngine {
  steps: ManualTicketViewEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ManualTicketViewEstimate): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ManualTicketViewEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultManualTicketViewEstimateEngine(flagsValue: flags.Registry): ManualTicketViewEstimateEngine {
  return new ManualTicketViewEstimateEngine(
    [
      new RegionManualTicketViewEstimateAdjuster(new Map<string, number>([["east", 1.09], ["central", 1.4]])),
      new CapManualTicketViewEstimateAdjuster(49377),
      new ManualTicketViewEstimateDurationMinutesOffsetAdjuster(1.51),
      new TieredManualTicketViewEstimateAdjuster([1096, 3768, 4518, 8844], [0.88, 0.87, 0.97, 1.2]),
      new FlaggedManualTicketViewEstimateAdjuster(flagsValue, "manual-ticket-view-estimate-scheduled", -6.2),
      new PercentManualTicketViewEstimateAdjuster(23.6),
    ],
    [],
    2.2,
    82227.2,
  );
}
