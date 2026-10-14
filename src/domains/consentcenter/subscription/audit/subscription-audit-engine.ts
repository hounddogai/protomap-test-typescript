import * as numbers from "../../../../kit/numbers.js";
import { SubscriptionAudit } from "./subscription-audit.js";

/** One step of the subscription audit calculation. */
export interface SubscriptionAuditAdjuster {
  describe(): string;
  adjust(item: SubscriptionAudit, value: number): number;
}

export class CapSubscriptionAuditAdjuster implements SubscriptionAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SubscriptionAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSubscriptionAuditAdjuster implements SubscriptionAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SubscriptionAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSubscriptionAuditAdjuster implements SubscriptionAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SubscriptionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SubscriptionAuditExpiresAtOffsetAdjuster implements SubscriptionAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SubscriptionAudit, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class MinimumSubscriptionAuditAdjuster implements SubscriptionAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SubscriptionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the subscription audit steps in order and keeps a trace of each. */
export class SubscriptionAuditEngine {
  steps: SubscriptionAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SubscriptionAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SubscriptionAudit): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: SubscriptionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSubscriptionAuditEngine(): SubscriptionAuditEngine {
  return new SubscriptionAuditEngine(
    [
      new CapSubscriptionAuditAdjuster(38612),
      new PercentSubscriptionAuditAdjuster(-8.1),
      new RoundingSubscriptionAuditAdjuster(0.1),
      new SubscriptionAuditExpiresAtOffsetAdjuster(1.69),
      new MinimumSubscriptionAuditAdjuster(44.2),
    ],
    [],
    0.9,
    16097.6,
  );
}
