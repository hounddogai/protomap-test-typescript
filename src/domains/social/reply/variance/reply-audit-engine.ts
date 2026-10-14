import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyAudit } from "./reply-audit.js";

/** One step of the reply audit calculation. */
export interface ReplyAuditFactor {
  describe(): string;
  adjust(item: ReplyAudit, value: number): number;
}

export class CapReplyAuditAdjuster implements ReplyAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredReplyAuditAdjuster implements ReplyAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingReplyAuditAdjuster implements ReplyAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentReplyAuditAdjuster implements ReplyAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ReplyAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumReplyAuditAdjuster implements ReplyAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReplyAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedReplyAuditAdjuster implements ReplyAuditFactor {
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

  adjust(item: ReplyAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reply audit steps in order and keeps a trace of each. */
export class ReplyAuditEngine {
  steps: ReplyAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReplyAudit): number {
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

  evaluateAll(items: ReplyAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReplyAuditEngine(flagsValue: flags.Registry): ReplyAuditEngine {
  return new ReplyAuditEngine(
    [
      new CapReplyAuditAdjuster(12315),
      new TieredReplyAuditAdjuster([470, 1698, 7997, 8922], [0.96, 0.9, 1.12, 1.09]),
      new RoundingReplyAuditAdjuster(1),
      new PercentReplyAuditAdjuster(7.3),
      new MinimumReplyAuditAdjuster(9),
      new FlaggedReplyAuditAdjuster(flagsValue, "reply-audit-tiered", 8.4),
    ],
    [],
    0.3,
    43935.8,
  );
}
