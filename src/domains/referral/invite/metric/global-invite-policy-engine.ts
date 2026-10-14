import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalInvitePolicy } from "./global-invite-policy.js";

/** One step of the global invite policy calculation. */
export interface GlobalInvitePolicyAdjuster {
  describe(): string;
  adjust(item: GlobalInvitePolicy, value: number): number;
}

export class UtmSourceGlobalInvitePolicyAdjuster implements GlobalInvitePolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: GlobalInvitePolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalInvitePolicyAdjuster implements GlobalInvitePolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalInvitePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedGlobalInvitePolicyAdjuster implements GlobalInvitePolicyAdjuster {
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

  adjust(item: GlobalInvitePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumGlobalInvitePolicyAdjuster implements GlobalInvitePolicyAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalInvitePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredGlobalInvitePolicyAdjuster implements GlobalInvitePolicyAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalInvitePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the global invite policy steps in order and keeps a trace of each. */
export class GlobalInvitePolicyEngine {
  steps: GlobalInvitePolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalInvitePolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalInvitePolicy): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: GlobalInvitePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalInvitePolicyEngine(flagsValue: flags.Registry): GlobalInvitePolicyEngine {
  return new GlobalInvitePolicyEngine(
    [
      new UtmSourceGlobalInvitePolicyAdjuster(new Map<string, number>([["online", 1.07], ["south", 1.03]])),
      new CapGlobalInvitePolicyAdjuster(38329),
      new FlaggedGlobalInvitePolicyAdjuster(flagsValue, "global-invite-policy-pending", -0.3),
      new MinimumGlobalInvitePolicyAdjuster(45.4),
      new TieredGlobalInvitePolicyAdjuster([3299, 6120], [1.13, 0.87]),
    ],
    [],
    4.5,
    28112.1,
  );
}
