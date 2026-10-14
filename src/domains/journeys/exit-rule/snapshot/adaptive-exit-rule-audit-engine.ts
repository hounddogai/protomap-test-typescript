import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

/** One step of the adaptive exit rule audit calculation. */
export interface AdaptiveExitRuleAuditAdjuster {
  describe(): string;
  adjust(item: AdaptiveExitRuleAudit, value: number): number;
}

export class PercentAdaptiveExitRuleAuditAdjuster implements AdaptiveExitRuleAuditAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveExitRuleAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapAdaptiveExitRuleAuditAdjuster implements AdaptiveExitRuleAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveExitRuleAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredAdaptiveExitRuleAuditAdjuster implements AdaptiveExitRuleAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveExitRuleAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveExitRuleAuditBatchSizeOffsetAdjuster implements AdaptiveExitRuleAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: AdaptiveExitRuleAudit, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class RoundingAdaptiveExitRuleAuditAdjuster implements AdaptiveExitRuleAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveExitRuleAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the adaptive exit rule audit steps in order and keeps a trace of each. */
export class AdaptiveExitRuleAuditEngine {
  steps: AdaptiveExitRuleAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveExitRuleAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveExitRuleAudit): number {
    let current = item.projectedValue();
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

  evaluateAll(items: AdaptiveExitRuleAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveExitRuleAuditEngine(): AdaptiveExitRuleAuditEngine {
  return new AdaptiveExitRuleAuditEngine(
    [
      new PercentAdaptiveExitRuleAuditAdjuster(-13.1),
      new CapAdaptiveExitRuleAuditAdjuster(37346),
      new TieredAdaptiveExitRuleAuditAdjuster([2500, 6707, 7753], [1.06, 1.03, 1.15]),
      new AdaptiveExitRuleAuditBatchSizeOffsetAdjuster(1.78),
      new RoundingAdaptiveExitRuleAuditAdjuster(0.05),
    ],
    [],
    0.2,
    53697,
  );
}
