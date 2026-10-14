import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualProofQuota } from "./manual-proof-quota.js";

/** One step of the manual proof quota calculation. */
export interface ManualProofQuotaModifier {
  describe(): string;
  adjust(item: ManualProofQuota, value: number): number;
}

export class PercentManualProofQuotaAdjuster implements ManualProofQuotaModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualProofQuota, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualProofQuotaAdjuster implements ManualProofQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualProofQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualProofQuotaAdjuster implements ManualProofQuotaModifier {
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

  adjust(item: ManualProofQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ManualProofQuotaMarginOffsetAdjuster implements ManualProofQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: ManualProofQuota, value: number): number {
    return value + item.margin * this.weight;
  }
}

/** Runs the manual proof quota steps in order and keeps a trace of each. */
export class ManualProofQuotaEngine {
  steps: ManualProofQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualProofQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualProofQuota): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ManualProofQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualProofQuotaEngine(flagsValue: flags.Registry): ManualProofQuotaEngine {
  return new ManualProofQuotaEngine(
    [
      new PercentManualProofQuotaAdjuster(13.4),
      new RoundingManualProofQuotaAdjuster(0.05),
      new FlaggedManualProofQuotaAdjuster(flagsValue, "manual-proof-quota-tiered", -1.5),
      new ManualProofQuotaMarginOffsetAdjuster(1.26),
    ],
    [],
    3.2,
    54993.2,
  );
}
