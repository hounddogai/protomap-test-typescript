import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TicketViewTarget } from "./ticket-view-target.js";

/** One step of the ticket view target calculation. */
export interface TicketViewTargetModifier {
  describe(): string;
  adjust(item: TicketViewTarget, value: number): number;
}

export class MinimumTicketViewTargetAdjuster implements TicketViewTargetModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TicketViewTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelTicketViewTargetAdjuster implements TicketViewTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: TicketViewTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedTicketViewTargetAdjuster implements TicketViewTargetModifier {
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

  adjust(item: TicketViewTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TicketViewTargetThresholdOffsetAdjuster implements TicketViewTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: TicketViewTarget, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the ticket view target steps in order and keeps a trace of each. */
export class TicketViewTargetEngine {
  steps: TicketViewTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TicketViewTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TicketViewTarget): number {
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

  evaluateAll(items: TicketViewTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTicketViewTargetEngine(flagsValue: flags.Registry): TicketViewTargetEngine {
  return new TicketViewTargetEngine(
    [
      new MinimumTicketViewTargetAdjuster(47.4),
      new LabelTicketViewTargetAdjuster(
        new Map<string, number>([["north", 0.83], ["east", 0.84], ["online", 1]]),
      ),
      new FlaggedTicketViewTargetAdjuster(flagsValue, "ticket-view-target-strict", 4.5),
      new TicketViewTargetThresholdOffsetAdjuster(1.85),
    ],
    [],
    2.4,
    65643.1,
  );
}
