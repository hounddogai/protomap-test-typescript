import * as numbers from "../../../../kit/numbers.js";
import { DefaultInviteRequest } from "./default-invite-request.js";

/** One step of the default invite request calculation. */
export interface DefaultInviteRequestFactor {
  describe(): string;
  adjust(item: DefaultInviteRequest, value: number): number;
}

export class RoundingDefaultInviteRequestAdjuster implements DefaultInviteRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultInviteRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultInviteRequestAdjuster implements DefaultInviteRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultInviteRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultInviteRequestAdjuster implements DefaultInviteRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultInviteRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default invite request steps in order and keeps a trace of each. */
export class DefaultInviteRequestEngine {
  steps: DefaultInviteRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultInviteRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultInviteRequest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DefaultInviteRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultInviteRequestEngine(): DefaultInviteRequestEngine {
  return new DefaultInviteRequestEngine(
    [
      new RoundingDefaultInviteRequestAdjuster(0.05),
      new PercentDefaultInviteRequestAdjuster(-21.7),
      new CapDefaultInviteRequestAdjuster(26251),
    ],
    [],
    4.7,
    87708,
  );
}
