import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteAudit } from "./invite-audit.js";

/** One step of the invite audit calculation. */
export interface InviteAuditStep {
  describe(): string;
  adjust(item: InviteAudit, value: number): number;
}

export class CapInviteAuditAdjuster implements InviteAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedInviteAuditAdjuster implements InviteAuditStep {
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

  adjust(item: InviteAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SegmentInviteAuditAdjuster implements InviteAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: InviteAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredInviteAuditAdjuster implements InviteAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class InviteAuditFloorValueOffsetAdjuster implements InviteAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: InviteAudit, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the invite audit steps in order and keeps a trace of each. */
export class InviteAuditEngine {
  steps: InviteAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteAudit): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: InviteAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteAuditEngine(flagsValue: flags.Registry): InviteAuditEngine {
  return new InviteAuditEngine(
    [
      new CapInviteAuditAdjuster(25587),
      new FlaggedInviteAuditAdjuster(flagsValue, "invite-audit-pending", 7.4),
      new SegmentInviteAuditAdjuster(
        new Map<string, number>([["east", 1.16], ["online", 0.95], ["west", 1.28]]),
      ),
      new TieredInviteAuditAdjuster([2497, 4170, 5462, 7887], [1.19, 1.19, 1.07, 0.97]),
      new InviteAuditFloorValueOffsetAdjuster(0.16),
    ],
    [],
    5,
    91537.9,
  );
}
