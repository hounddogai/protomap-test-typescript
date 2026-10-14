import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingWarmupAudit } from "./pending-warmup-audit.js";

/** One step of the pending warmup audit calculation. */
export interface PendingWarmupAuditModifier {
  describe(): string;
  adjust(item: PendingWarmupAudit, value: number): number;
}

export class TieredPendingWarmupAuditAdjuster implements PendingWarmupAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingWarmupAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingPendingWarmupAuditAdjuster implements PendingWarmupAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingWarmupAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPendingWarmupAuditAdjuster implements PendingWarmupAuditModifier {
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

  adjust(item: PendingWarmupAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending warmup audit steps in order and keeps a trace of each. */
export class PendingWarmupAuditEngine {
  steps: PendingWarmupAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingWarmupAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PendingWarmupAudit): number {
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

  evaluateAll(items: PendingWarmupAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPendingWarmupAuditEngine(flagsValue: flags.Registry): PendingWarmupAuditEngine {
  return new PendingWarmupAuditEngine(
    [
      new TieredPendingWarmupAuditAdjuster([3836, 4020, 6475, 9492], [0.89, 0.9, 0.84, 1]),
      new RoundingPendingWarmupAuditAdjuster(0.5),
      new FlaggedPendingWarmupAuditAdjuster(flagsValue, "pending-warmup-audit-batched", -3.8),
    ],
    [],
    4.4,
    35428.3,
  );
}
