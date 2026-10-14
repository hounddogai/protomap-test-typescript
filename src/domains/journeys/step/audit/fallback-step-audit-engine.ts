import * as flags from "../../../../kit/flags.js";
import { FallbackStepAudit } from "./fallback-step-audit.js";

/** One step of the fallback step audit calculation. */
export interface FallbackStepAuditModifier {
  describe(): string;
  adjust(item: FallbackStepAudit, value: number): number;
}

export class LocaleFallbackStepAuditAdjuster implements FallbackStepAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackStepAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumFallbackStepAuditAdjuster implements FallbackStepAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackStepAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFallbackStepAuditAdjuster implements FallbackStepAuditModifier {
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

  adjust(item: FallbackStepAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapFallbackStepAuditAdjuster implements FallbackStepAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackStepAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackStepAuditAdjuster implements FallbackStepAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackStepAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the fallback step audit steps in order and keeps a trace of each. */
export class FallbackStepAuditEngine {
  steps: FallbackStepAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackStepAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FallbackStepAudit): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: FallbackStepAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFallbackStepAuditEngine(flagsValue: flags.Registry): FallbackStepAuditEngine {
  return new FallbackStepAuditEngine(
    [
      new LocaleFallbackStepAuditAdjuster(
        new Map<string, number>([["west", 1.38], ["central", 0.73], ["online", 0.81]]),
      ),
      new MinimumFallbackStepAuditAdjuster(42.2),
      new FlaggedFallbackStepAuditAdjuster(flagsValue, "fallback-step-audit-seasonal", 5.8),
      new CapFallbackStepAuditAdjuster(46850),
      new TieredFallbackStepAuditAdjuster([2134, 3427, 7021, 8529], [0.99, 1.11, 1, 0.97]),
    ],
    [],
    4,
    69529.9,
  );
}
