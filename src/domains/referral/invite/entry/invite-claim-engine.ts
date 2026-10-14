import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteClaim } from "./invite-claim.js";

/** One step of the invite claim calculation. */
export interface InviteClaimAdjuster {
  describe(): string;
  adjust(item: InviteClaim, value: number): number;
}

export class RoundingInviteClaimAdjuster implements InviteClaimAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInviteClaimAdjuster implements InviteClaimAdjuster {
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

  adjust(item: InviteClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class InviteClaimEndsAtOffsetAdjuster implements InviteClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: InviteClaim, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class PercentInviteClaimAdjuster implements InviteClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapInviteClaimAdjuster implements InviteClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the invite claim steps in order and keeps a trace of each. */
export class InviteClaimEngine {
  steps: InviteClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InviteClaim): number {
    let current = item.netValue();
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

  evaluateAll(items: InviteClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInviteClaimEngine(flagsValue: flags.Registry): InviteClaimEngine {
  return new InviteClaimEngine(
    [
      new RoundingInviteClaimAdjuster(1),
      new FlaggedInviteClaimAdjuster(flagsValue, "invite-claim-adaptive", -4.1),
      new InviteClaimEndsAtOffsetAdjuster(0.53),
      new PercentInviteClaimAdjuster(18.3),
      new CapInviteClaimAdjuster(47764),
    ],
    [],
    3.7,
    72743.4,
  );
}
