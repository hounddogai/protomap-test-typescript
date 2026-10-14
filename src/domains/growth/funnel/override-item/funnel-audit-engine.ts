import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelAudit } from "./funnel-audit.js";

/** One step of the funnel audit calculation. */
export interface FunnelAuditModifier {
  describe(): string;
  adjust(item: FunnelAudit, value: number): number;
}

export class FlaggedFunnelAuditAdjuster implements FunnelAuditModifier {
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

  adjust(item: FunnelAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFunnelAuditAdjuster implements FunnelAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FunnelAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FunnelAuditFrequencyCapOffsetAdjuster implements FunnelAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: FunnelAudit, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RoundingFunnelAuditAdjuster implements FunnelAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFunnelAuditAdjuster implements FunnelAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FunnelAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameFunnelAuditAdjuster implements FunnelAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: FunnelAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the funnel audit steps in order and keeps a trace of each. */
export class FunnelAuditEngine {
  steps: FunnelAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FunnelAudit): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: FunnelAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFunnelAuditEngine(flagsValue: flags.Registry): FunnelAuditEngine {
  return new FunnelAuditEngine(
    [
      new FlaggedFunnelAuditAdjuster(flagsValue, "funnel-audit-regional", -6.6),
      new PercentFunnelAuditAdjuster(8.9),
      new FunnelAuditFrequencyCapOffsetAdjuster(1.81),
      new RoundingFunnelAuditAdjuster(0.1),
      new TieredFunnelAuditAdjuster([3053, 5350], [1.19, 1.19]),
      new NameFunnelAuditAdjuster(new Map<string, number>([["north", 1.3], ["online", 1.07]])),
    ],
    [],
    2.6,
    35265.7,
  );
}
