import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewBundle } from "./ticket-view-bundle.js";

/** One step of the ticket view bundle calculation. */
export interface TicketViewBundleAdjuster {
  describe(): string;
  adjust(item: TicketViewBundle, value: number): number;
}

export class FlaggedTicketViewBundleAdjuster implements TicketViewBundleAdjuster {
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

  adjust(item: TicketViewBundle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewBundleWeightOffsetAdjuster implements TicketViewBundleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: TicketViewBundle, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class TieredTicketViewBundleAdjuster implements TicketViewBundleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TicketViewBundle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentTicketViewBundleAdjuster implements TicketViewBundleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TicketViewBundle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the ticket view bundle steps in order and keeps a trace of each. */
export class TicketViewBundleEngine {
  steps: TicketViewBundleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewBundleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TicketViewBundle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: TicketViewBundle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTicketViewBundleEngine(flagsValue: flags.Registry): TicketViewBundleEngine {
  return new TicketViewBundleEngine(
    [
      new FlaggedTicketViewBundleAdjuster(flagsValue, "ticket-view-bundle-default", -1.4),
      new TicketViewBundleWeightOffsetAdjuster(1.34),
      new TieredTicketViewBundleAdjuster([3525, 7213, 9286], [1.12, 0.81, 1.03]),
      new PercentTicketViewBundleAdjuster(22.6),
    ],
    [],
    0.6,
    11568.8,
  );
}
