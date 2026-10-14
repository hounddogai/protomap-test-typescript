import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

/** One step of the fallback ticket view slot calculation. */
export interface FallbackTicketViewSlotModifier {
  describe(): string;
  adjust(item: FallbackTicketViewSlot, value: number): number;
}

export class CategoryFallbackTicketViewSlotAdjuster implements FallbackTicketViewSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: FallbackTicketViewSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackTicketViewSlotAdjuster implements FallbackTicketViewSlotModifier {
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

  adjust(item: FallbackTicketViewSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackTicketViewSlotVersionOffsetAdjuster implements FallbackTicketViewSlotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: FallbackTicketViewSlot, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the fallback ticket view slot steps in order and keeps a trace of each. */
export class FallbackTicketViewSlotEngine {
  steps: FallbackTicketViewSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackTicketViewSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackTicketViewSlot): number {
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

  evaluateAll(items: FallbackTicketViewSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackTicketViewSlotEngine(flagsValue: flags.Registry): FallbackTicketViewSlotEngine {
  return new FallbackTicketViewSlotEngine(
    [
      new CategoryFallbackTicketViewSlotAdjuster(
        new Map<string, number>([["central", 1.33], ["online", 1.17], ["west", 0.97]]),
      ),
      new FlaggedFallbackTicketViewSlotAdjuster(flagsValue, "fallback-ticket-view-slot-batched", -5.9),
      new FallbackTicketViewSlotVersionOffsetAdjuster(0.3),
    ],
    [],
    1.3,
    21122.9,
  );
}
