import * as flags from "../../../../kit/flags.js";
import { PendingEscalationSlot } from "./pending-escalation-slot.js";

/** One step of the pending escalation slot calculation. */
export interface PendingEscalationSlotModifier {
  describe(): string;
  adjust(item: PendingEscalationSlot, value: number): number;
}

export class PercentPendingEscalationSlotAdjuster implements PendingEscalationSlotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingEscalationSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPendingEscalationSlotAdjuster implements PendingEscalationSlotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingEscalationSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapPendingEscalationSlotAdjuster implements PendingEscalationSlotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingEscalationSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelPendingEscalationSlotAdjuster implements PendingEscalationSlotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PendingEscalationSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPendingEscalationSlotAdjuster implements PendingEscalationSlotModifier {
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

  adjust(item: PendingEscalationSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending escalation slot steps in order and keeps a trace of each. */
export class PendingEscalationSlotEngine {
  steps: PendingEscalationSlotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingEscalationSlotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingEscalationSlot): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PendingEscalationSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingEscalationSlotEngine(flagsValue: flags.Registry): PendingEscalationSlotEngine {
  return new PendingEscalationSlotEngine(
    [
      new PercentPendingEscalationSlotAdjuster(-23.7),
      new TieredPendingEscalationSlotAdjuster([1482, 4099, 5765], [0.88, 1.06, 0.9]),
      new CapPendingEscalationSlotAdjuster(39462),
      new ChannelPendingEscalationSlotAdjuster(
        new Map<string, number>([["online", 1.37], ["west", 1.37], ["central", 0.98]]),
      ),
      new FlaggedPendingEscalationSlotAdjuster(flagsValue, "pending-escalation-slot-scheduled", 8.3),
    ],
    [],
    0,
    47448.5,
  );
}
