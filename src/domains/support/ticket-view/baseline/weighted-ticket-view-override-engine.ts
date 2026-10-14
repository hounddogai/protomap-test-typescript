import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedTicketViewOverride } from "./weighted-ticket-view-override.js";

/** One step of the weighted ticket view override calculation. */
export interface WeightedTicketViewOverrideAdjuster {
  describe(): string;
  adjust(item: WeightedTicketViewOverride, value: number): number;
}

export class CapWeightedTicketViewOverrideAdjuster implements WeightedTicketViewOverrideAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedTicketViewOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedTicketViewOverrideAdjuster implements WeightedTicketViewOverrideAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedTicketViewOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelWeightedTicketViewOverrideAdjuster implements WeightedTicketViewOverrideAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WeightedTicketViewOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedTicketViewOverrideAdjuster implements WeightedTicketViewOverrideAdjuster {
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

  adjust(item: WeightedTicketViewOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedTicketViewOverrideClicksOffsetAdjuster implements WeightedTicketViewOverrideAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: WeightedTicketViewOverride, value: number): number {
    return value + item.clicks * this.weight;
  }
}

/** Runs the weighted ticket view override steps in order and keeps a trace of each. */
export class WeightedTicketViewOverrideEngine {
  steps: WeightedTicketViewOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedTicketViewOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedTicketViewOverride): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: WeightedTicketViewOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedTicketViewOverrideEngine(flagsValue: flags.Registry): WeightedTicketViewOverrideEngine {
  return new WeightedTicketViewOverrideEngine(
    [
      new CapWeightedTicketViewOverrideAdjuster(26975),
      new TieredWeightedTicketViewOverrideAdjuster([2929, 5266, 7397], [0.83, 0.84, 0.81]),
      new ChannelWeightedTicketViewOverrideAdjuster(new Map<string, number>([["south", 0.89]])),
      new FlaggedWeightedTicketViewOverrideAdjuster(flagsValue, "weighted-ticket-view-override-scheduled", 6.6),
      new WeightedTicketViewOverrideClicksOffsetAdjuster(0.37),
    ],
    [],
    0.7,
    80343,
  );
}
