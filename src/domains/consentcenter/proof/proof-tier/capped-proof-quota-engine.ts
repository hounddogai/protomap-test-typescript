import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedProofQuota } from "./capped-proof-quota.js";

/** One step of the capped proof quota calculation. */
export interface CappedProofQuotaModifier {
  describe(): string;
  adjust(item: CappedProofQuota, value: number): number;
}

export class FlaggedCappedProofQuotaAdjuster implements CappedProofQuotaModifier {
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

  adjust(item: CappedProofQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCappedProofQuotaAdjuster implements CappedProofQuotaModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedProofQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class CappedProofQuotaLimitOffsetAdjuster implements CappedProofQuotaModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: CappedProofQuota, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingCappedProofQuotaAdjuster implements CappedProofQuotaModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedProofQuota, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumCappedProofQuotaAdjuster implements CappedProofQuotaModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedProofQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped proof quota steps in order and keeps a trace of each. */
export class CappedProofQuotaEngine {
  steps: CappedProofQuotaModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedProofQuotaModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedProofQuota): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: CappedProofQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedProofQuotaEngine(flagsValue: flags.Registry): CappedProofQuotaEngine {
  return new CappedProofQuotaEngine(
    [
      new FlaggedCappedProofQuotaAdjuster(flagsValue, "capped-proof-quota-fallback", -2.3),
      new CapCappedProofQuotaAdjuster(43562),
      new CappedProofQuotaLimitOffsetAdjuster(1.04),
      new RoundingCappedProofQuotaAdjuster(1),
      new MinimumCappedProofQuotaAdjuster(28.1),
    ],
    [],
    2.9,
    36229.9,
  );
}
