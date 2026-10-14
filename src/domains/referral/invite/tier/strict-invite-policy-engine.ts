import * as flags from "../../../../kit/flags.js";
import { StrictInvitePolicy } from "./strict-invite-policy.js";

/** One step of the strict invite policy calculation. */
export interface StrictInvitePolicyAdjuster {
  describe(): string;
  adjust(item: StrictInvitePolicy, value: number): number;
}

export class TitleStrictInvitePolicyAdjuster implements StrictInvitePolicyAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: StrictInvitePolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedStrictInvitePolicyAdjuster implements StrictInvitePolicyAdjuster {
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

  adjust(item: StrictInvitePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictInvitePolicyAdjuster implements StrictInvitePolicyAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictInvitePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict invite policy steps in order and keeps a trace of each. */
export class StrictInvitePolicyEngine {
  steps: StrictInvitePolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictInvitePolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: StrictInvitePolicy): number {
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

  evaluateAll(items: StrictInvitePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultStrictInvitePolicyEngine(flagsValue: flags.Registry): StrictInvitePolicyEngine {
  return new StrictInvitePolicyEngine(
    [
      new TitleStrictInvitePolicyAdjuster(new Map<string, number>([["east", 1.36], ["central", 1.25]])),
      new FlaggedStrictInvitePolicyAdjuster(flagsValue, "strict-invite-policy-seasonal", -5.1),
      new CapStrictInvitePolicyAdjuster(43903),
    ],
    [],
    2.7,
    3971.4,
  );
}
