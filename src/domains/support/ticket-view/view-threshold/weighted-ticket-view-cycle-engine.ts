import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

/** One step of the weighted ticket view cycle calculation. */
export interface WeightedTicketViewCycleFactor {
  describe(): string;
  adjust(item: WeightedTicketViewCycle, value: number): number;
}

export class PercentWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedTicketViewCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WeightedTicketViewCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedTicketViewCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedTicketViewCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedTicketViewCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedWeightedTicketViewCycleAdjuster implements WeightedTicketViewCycleFactor {
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

  adjust(item: WeightedTicketViewCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the weighted ticket view cycle steps in order and keeps a trace of each. */
export class WeightedTicketViewCycleEngine {
  steps: WeightedTicketViewCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTicketViewCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: WeightedTicketViewCycle): number {
    let current = item.measuredValue();
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

  evaluateAll(items: WeightedTicketViewCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultWeightedTicketViewCycleEngine(flagsValue: flags.Registry): WeightedTicketViewCycleEngine {
  return new WeightedTicketViewCycleEngine(
    [
      new PercentWeightedTicketViewCycleAdjuster(-10.5),
      new CountryWeightedTicketViewCycleAdjuster(new Map<string, number>([["retail", 1.3]])),
      new TieredWeightedTicketViewCycleAdjuster([1733, 5715], [1.02, 1.07]),
      new CapWeightedTicketViewCycleAdjuster(18259),
      new RoundingWeightedTicketViewCycleAdjuster(0.05),
      new FlaggedWeightedTicketViewCycleAdjuster(flagsValue, "weighted-ticket-view-cycle-default", -5.7),
    ],
    [],
    0.2,
    65264.1,
  );
}
