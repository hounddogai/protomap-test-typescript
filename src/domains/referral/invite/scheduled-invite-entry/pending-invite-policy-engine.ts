import * as numbers from "../../../../kit/numbers.js";
import { PendingInvitePolicy } from "./pending-invite-policy.js";

/** One step of the pending invite policy calculation. */
export interface PendingInvitePolicyAdjuster {
  describe(): string;
  adjust(item: PendingInvitePolicy, value: number): number;
}

export class PercentPendingInvitePolicyAdjuster implements PendingInvitePolicyAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingInvitePolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingInvitePolicyCeilingOffsetAdjuster implements PendingInvitePolicyAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingInvitePolicy, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingPendingInvitePolicyAdjuster implements PendingInvitePolicyAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingInvitePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending invite policy steps in order and keeps a trace of each. */
export class PendingInvitePolicyEngine {
  steps: PendingInvitePolicyAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingInvitePolicyAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingInvitePolicy): number {
    let current = item.netVolume();
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

  evaluateAll(items: PendingInvitePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingInvitePolicyEngine(): PendingInvitePolicyEngine {
  return new PendingInvitePolicyEngine(
    [
      new PercentPendingInvitePolicyAdjuster(4.1),
      new PendingInvitePolicyCeilingOffsetAdjuster(1.78),
      new RoundingPendingInvitePolicyAdjuster(5),
    ],
    [],
    2,
    89147.5,
  );
}
