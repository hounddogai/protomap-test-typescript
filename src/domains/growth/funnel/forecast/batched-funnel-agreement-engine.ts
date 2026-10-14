import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { BatchedFunnelAgreement } from "./batched-funnel-agreement.js";

/** One step of the batched funnel agreement calculation. */
export interface BatchedFunnelAgreementAdjuster {
  describe(): string;
  adjust(item: BatchedFunnelAgreement, value: number): number;
}

export class MinimumBatchedFunnelAgreementAdjuster implements BatchedFunnelAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BatchedFunnelAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedBatchedFunnelAgreementAdjuster implements BatchedFunnelAgreementAdjuster {
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

  adjust(item: BatchedFunnelAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingBatchedFunnelAgreementAdjuster implements BatchedFunnelAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: BatchedFunnelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class BatchedFunnelAgreementSequenceOffsetAdjuster implements BatchedFunnelAgreementAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: BatchedFunnelAgreement, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TitleBatchedFunnelAgreementAdjuster implements BatchedFunnelAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: BatchedFunnelAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredBatchedFunnelAgreementAdjuster implements BatchedFunnelAgreementAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BatchedFunnelAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the batched funnel agreement steps in order and keeps a trace of each. */
export class BatchedFunnelAgreementEngine {
  steps: BatchedFunnelAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BatchedFunnelAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BatchedFunnelAgreement): number {
    let current = item.measuredValue();
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

  evaluateAll(items: BatchedFunnelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBatchedFunnelAgreementEngine(flagsValue: flags.Registry): BatchedFunnelAgreementEngine {
  return new BatchedFunnelAgreementEngine(
    [
      new MinimumBatchedFunnelAgreementAdjuster(49.3),
      new FlaggedBatchedFunnelAgreementAdjuster(flagsValue, "batched-funnel-agreement-strict", -0.1),
      new RoundingBatchedFunnelAgreementAdjuster(1),
      new BatchedFunnelAgreementSequenceOffsetAdjuster(1.53),
      new TitleBatchedFunnelAgreementAdjuster(new Map<string, number>([["central", 1.2]])),
      new TieredBatchedFunnelAgreementAdjuster([6109, 8654, 8701], [1.18, 1.11, 0.98]),
    ],
    [],
    2.2,
    77545.5,
  );
}
