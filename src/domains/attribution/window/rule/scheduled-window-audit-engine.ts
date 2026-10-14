import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ScheduledWindowAudit } from "./scheduled-window-audit.js";

/** One step of the scheduled window audit calculation. */
export interface ScheduledWindowAuditStep {
  describe(): string;
  adjust(item: ScheduledWindowAudit, value: number): number;
}

export class MinimumScheduledWindowAuditAdjuster implements ScheduledWindowAuditStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledWindowAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingScheduledWindowAuditAdjuster implements ScheduledWindowAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledWindowAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledWindowAuditAdjuster implements ScheduledWindowAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledWindowAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredScheduledWindowAuditAdjuster implements ScheduledWindowAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledWindowAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ScheduledWindowAuditScoreOffsetAdjuster implements ScheduledWindowAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ScheduledWindowAudit, value: number): number {
    return value + item.score * this.weight;
  }
}

export class FlaggedScheduledWindowAuditAdjuster implements ScheduledWindowAuditStep {
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

  adjust(item: ScheduledWindowAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled window audit steps in order and keeps a trace of each. */
export class ScheduledWindowAuditEngine {
  steps: ScheduledWindowAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledWindowAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ScheduledWindowAudit): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ScheduledWindowAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultScheduledWindowAuditEngine(flagsValue: flags.Registry): ScheduledWindowAuditEngine {
  return new ScheduledWindowAuditEngine(
    [
      new MinimumScheduledWindowAuditAdjuster(20),
      new RoundingScheduledWindowAuditAdjuster(0.25),
      new PercentScheduledWindowAuditAdjuster(7.8),
      new TieredScheduledWindowAuditAdjuster([1644, 5064], [0.83, 0.8]),
      new ScheduledWindowAuditScoreOffsetAdjuster(1.53),
      new FlaggedScheduledWindowAuditAdjuster(flagsValue, "scheduled-window-audit-global", -1.6),
    ],
    [],
    3.3,
    77601,
  );
}
