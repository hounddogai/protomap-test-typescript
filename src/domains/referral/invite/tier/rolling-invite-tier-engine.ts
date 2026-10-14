import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingInviteTier } from "./rolling-invite-tier.js";

/** One step of the rolling invite tier calculation. */
export interface RollingInviteTierModifier {
  describe(): string;
  adjust(item: RollingInviteTier, value: number): number;
}

export class TieredRollingInviteTierAdjuster implements RollingInviteTierModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingInviteTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRollingInviteTierAdjuster implements RollingInviteTierModifier {
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

  adjust(item: RollingInviteTier, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRollingInviteTierAdjuster implements RollingInviteTierModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingInviteTier, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameRollingInviteTierAdjuster implements RollingInviteTierModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RollingInviteTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling invite tier steps in order and keeps a trace of each. */
export class RollingInviteTierEngine {
  steps: RollingInviteTierModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingInviteTierModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingInviteTier): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingInviteTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingInviteTierEngine(flagsValue: flags.Registry): RollingInviteTierEngine {
  return new RollingInviteTierEngine(
    [
      new TieredRollingInviteTierAdjuster([429, 508, 9291], [0.81, 1.19, 0.94]),
      new FlaggedRollingInviteTierAdjuster(flagsValue, "rolling-invite-tier-seasonal", 3.2),
      new PercentRollingInviteTierAdjuster(-22.2),
      new NameRollingInviteTierAdjuster(new Map<string, number>([["west", 0.83], ["east", 0.89]])),
    ],
    [],
    0.6,
    47027.6,
  );
}
