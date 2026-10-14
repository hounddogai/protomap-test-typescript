import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalWindowAudit } from "./regional-window-audit.js";

/** One step of the regional window audit calculation. */
export interface RegionalWindowAuditAdjuster {
  describe(): string;
  adjust(item: RegionalWindowAudit, value: number): number;
}

export class ChannelRegionalWindowAuditAdjuster implements RegionalWindowAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: RegionalWindowAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalWindowAuditAdjuster implements RegionalWindowAuditAdjuster {
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

  adjust(item: RegionalWindowAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalWindowAuditAdjuster implements RegionalWindowAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalWindowAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalWindowAuditAdjuster implements RegionalWindowAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalWindowAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional window audit steps in order and keeps a trace of each. */
export class RegionalWindowAuditEngine {
  steps: RegionalWindowAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalWindowAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalWindowAudit): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RegionalWindowAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalWindowAuditEngine(flagsValue: flags.Registry): RegionalWindowAuditEngine {
  return new RegionalWindowAuditEngine(
    [
      new ChannelRegionalWindowAuditAdjuster(new Map<string, number>([["west", 1.13], ["retail", 1.39]])),
      new FlaggedRegionalWindowAuditAdjuster(flagsValue, "regional-window-audit-adaptive", -1.2),
      new RoundingRegionalWindowAuditAdjuster(0.5),
      new MinimumRegionalWindowAuditAdjuster(20.8),
    ],
    [],
    4,
    6539.7,
  );
}
