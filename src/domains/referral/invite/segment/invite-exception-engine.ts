import * as numbers from "../../../../kit/numbers.js";
import { InviteException } from "./invite-exception.js";

/** One step of the invite exception calculation. */
export interface InviteExceptionModifier {
  describe(): string;
  adjust(item: InviteException, value: number): number;
}

export class RoundingInviteExceptionAdjuster implements InviteExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapInviteExceptionAdjuster implements InviteExceptionModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteException, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentInviteExceptionAdjuster implements InviteExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the invite exception steps in order and keeps a trace of each. */
export class InviteExceptionEngine {
  steps: InviteExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteException): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: InviteException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteExceptionEngine(): InviteExceptionEngine {
  return new InviteExceptionEngine(
    [
      new RoundingInviteExceptionAdjuster(0.25),
      new CapInviteExceptionAdjuster(41927),
      new PercentInviteExceptionAdjuster(22.9),
    ],
    [],
    1.2,
    13801.5,
  );
}
