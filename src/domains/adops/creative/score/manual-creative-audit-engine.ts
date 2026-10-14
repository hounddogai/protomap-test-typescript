import * as numbers from "../../../../kit/numbers.js";
import { ManualCreativeAudit } from "./manual-creative-audit.js";

/** One step of the manual creative audit calculation. */
export interface ManualCreativeAuditAdjuster {
  describe(): string;
  adjust(item: ManualCreativeAudit, value: number): number;
}

export class MinimumManualCreativeAuditAdjuster implements ManualCreativeAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualCreativeAuditAdjuster implements ManualCreativeAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualCreativeAuditAdjuster implements ManualCreativeAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualCreativeAuditAdjuster implements ManualCreativeAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleManualCreativeAuditAdjuster implements ManualCreativeAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ManualCreativeAuditCostOffsetAdjuster implements ManualCreativeAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus cost times ${this.weight}`;
  }

  adjust(item: ManualCreativeAudit, value: number): number {
    return value + item.cost * this.weight;
  }
}

/** Runs the manual creative audit steps in order and keeps a trace of each. */
export class ManualCreativeAuditEngine {
  steps: ManualCreativeAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualCreativeAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualCreativeAudit): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ManualCreativeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualCreativeAuditEngine(): ManualCreativeAuditEngine {
  return new ManualCreativeAuditEngine(
    [
      new MinimumManualCreativeAuditAdjuster(2.1),
      new RoundingManualCreativeAuditAdjuster(0.1),
      new CapManualCreativeAuditAdjuster(31646),
      new PercentManualCreativeAuditAdjuster(-9.2),
      new LocaleManualCreativeAuditAdjuster(new Map<string, number>([["west", 1.07], ["central", 1.27]])),
      new ManualCreativeAuditCostOffsetAdjuster(1.06),
    ],
    [],
    2.1,
    38623.7,
  );
}
