import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaAudit } from "./sla-audit.js";

/** One step of the sla audit calculation. */
export interface SlaAuditAdjuster {
  describe(): string;
  adjust(item: SlaAudit, value: number): number;
}

export class SlaAuditExpiresAtOffsetAdjuster implements SlaAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: SlaAudit, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class FlaggedSlaAuditAdjuster implements SlaAuditAdjuster {
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

  adjust(item: SlaAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSlaAuditAdjuster implements SlaAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingSlaAuditAdjuster implements SlaAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSlaAuditAdjuster implements SlaAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredSlaAuditAdjuster implements SlaAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SlaAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the sla audit steps in order and keeps a trace of each. */
export class SlaAuditEngine {
  steps: SlaAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaAudit): number {
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

  evaluateAll(items: SlaAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaAuditEngine(flagsValue: flags.Registry): SlaAuditEngine {
  return new SlaAuditEngine(
    [
      new SlaAuditExpiresAtOffsetAdjuster(1.71),
      new FlaggedSlaAuditAdjuster(flagsValue, "sla-audit-adaptive", -6.2),
      new MinimumSlaAuditAdjuster(35.8),
      new RoundingSlaAuditAdjuster(0.1),
      new CapSlaAuditAdjuster(22969),
      new TieredSlaAuditAdjuster([1196, 6706, 6888], [1.07, 0.82, 0.89]),
    ],
    [],
    1.1,
    15234.4,
  );
}
