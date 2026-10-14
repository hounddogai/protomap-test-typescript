import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPacingAudit } from "./global-pacing-audit.js";

/** One step of the global pacing audit calculation. */
export interface GlobalPacingAuditFactor {
  describe(): string;
  adjust(item: GlobalPacingAudit, value: number): number;
}

export class FlaggedGlobalPacingAuditAdjuster implements GlobalPacingAuditFactor {
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

  adjust(item: GlobalPacingAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelGlobalPacingAuditAdjuster implements GlobalPacingAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: GlobalPacingAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapGlobalPacingAuditAdjuster implements GlobalPacingAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPacingAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalPacingAuditAdjuster implements GlobalPacingAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPacingAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredGlobalPacingAuditAdjuster implements GlobalPacingAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalPacingAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class GlobalPacingAuditBudgetOffsetAdjuster implements GlobalPacingAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: GlobalPacingAudit, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the global pacing audit steps in order and keeps a trace of each. */
export class GlobalPacingAuditEngine {
  steps: GlobalPacingAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPacingAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalPacingAudit): number {
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

  evaluateAll(items: GlobalPacingAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalPacingAuditEngine(flagsValue: flags.Registry): GlobalPacingAuditEngine {
  return new GlobalPacingAuditEngine(
    [
      new FlaggedGlobalPacingAuditAdjuster(flagsValue, "global-pacing-audit-manual", -5),
      new ChannelGlobalPacingAuditAdjuster(new Map<string, number>([["west", 1.28]])),
      new CapGlobalPacingAuditAdjuster(1441),
      new RoundingGlobalPacingAuditAdjuster(1),
      new TieredGlobalPacingAuditAdjuster([3006, 3461], [1.06, 0.98]),
      new GlobalPacingAuditBudgetOffsetAdjuster(0.87),
    ],
    [],
    3.2,
    29832.6,
  );
}
