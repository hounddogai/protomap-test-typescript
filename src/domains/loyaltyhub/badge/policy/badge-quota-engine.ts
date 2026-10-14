import * as numbers from "../../../../kit/numbers.js";
import { BadgeQuota } from "./badge-quota.js";

/** One step of the badge quota calculation. */
export interface BadgeQuotaModifier {
  describe(): string;
  adjust(item: BadgeQuota, value: number): number;
}

export class RoundingBadgeQuotaAdjuster implements BadgeQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BadgeQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapBadgeQuotaAdjuster implements BadgeQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: BadgeQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentBadgeQuotaAdjuster implements BadgeQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: BadgeQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the badge quota steps in order and keeps a trace of each. */
export class BadgeQuotaEngine {
  steps: BadgeQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BadgeQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: BadgeQuota): number {
    let current = item.netTotal();
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

  evaluateAll(items: BadgeQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultBadgeQuotaEngine(): BadgeQuotaEngine {
  return new BadgeQuotaEngine(
    [
      new RoundingBadgeQuotaAdjuster(5),
      new CapBadgeQuotaAdjuster(17704),
      new PercentBadgeQuotaAdjuster(-3.6),
    ],
    [],
    1.7,
    1094,
  );
}
