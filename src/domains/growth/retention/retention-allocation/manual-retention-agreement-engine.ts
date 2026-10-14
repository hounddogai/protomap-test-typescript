import * as numbers from "../../../../kit/numbers.js";
import { ManualRetentionAgreement } from "./manual-retention-agreement.js";

/** One step of the manual retention agreement calculation. */
export interface ManualRetentionAgreementStep {
  describe(): string;
  adjust(item: ManualRetentionAgreement, value: number): number;
}

export class PercentManualRetentionAgreementAdjuster implements ManualRetentionAgreementStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRetentionAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleManualRetentionAgreementAdjuster implements ManualRetentionAgreementStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: ManualRetentionAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumManualRetentionAgreementAdjuster implements ManualRetentionAgreementStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRetentionAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual retention agreement steps in order and keeps a trace of each. */
export class ManualRetentionAgreementEngine {
  steps: ManualRetentionAgreementStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRetentionAgreementStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualRetentionAgreement): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: ManualRetentionAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualRetentionAgreementEngine(): ManualRetentionAgreementEngine {
  return new ManualRetentionAgreementEngine(
    [
      new PercentManualRetentionAgreementAdjuster(-22.4),
      new LocaleManualRetentionAgreementAdjuster(new Map<string, number>([["retail", 1.25]])),
      new MinimumManualRetentionAgreementAdjuster(27),
    ],
    [],
    4.2,
    16296,
  );
}
