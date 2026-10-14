import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofQuota } from "./proof-quota.js";

/** One step of the proof quota calculation. */
export interface ProofQuotaFactor {
  describe(): string;
  adjust(item: ProofQuota, value: number): number;
}

export class FlaggedProofQuotaAdjuster implements ProofQuotaFactor {
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

  adjust(item: ProofQuota, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ProofQuotaAmountOffsetAdjuster implements ProofQuotaFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: ProofQuota, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class MinimumProofQuotaAdjuster implements ProofQuotaFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ProofQuota, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapProofQuotaAdjuster implements ProofQuotaFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofQuota, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof quota steps in order and keeps a trace of each. */
export class ProofQuotaEngine {
  steps: ProofQuotaFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofQuotaFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofQuota): number {
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

  evaluateAll(items: ProofQuota[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofQuotaEngine(flagsValue: flags.Registry): ProofQuotaEngine {
  return new ProofQuotaEngine(
    [
      new FlaggedProofQuotaAdjuster(flagsValue, "proof-quota-manual", 9.6),
      new ProofQuotaAmountOffsetAdjuster(0.08),
      new MinimumProofQuotaAdjuster(4.5),
      new CapProofQuotaAdjuster(43643),
    ],
    [],
    3.2,
    14834,
  );
}
