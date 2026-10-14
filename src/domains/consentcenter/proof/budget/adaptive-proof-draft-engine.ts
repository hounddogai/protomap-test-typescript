import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveProofDraft } from "./adaptive-proof-draft.js";

/** One step of the adaptive proof draft calculation. */
export interface AdaptiveProofDraftStep {
  describe(): string;
  adjust(item: AdaptiveProofDraft, value: number): number;
}

export class TieredAdaptiveProofDraftAdjuster implements AdaptiveProofDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveProofDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class AdaptiveProofDraftBatchSizeOffsetAdjuster implements AdaptiveProofDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: AdaptiveProofDraft, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentAdaptiveProofDraftAdjuster implements AdaptiveProofDraftStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveProofDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptiveProofDraftAdjuster implements AdaptiveProofDraftStep {
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

  adjust(item: AdaptiveProofDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the adaptive proof draft steps in order and keeps a trace of each. */
export class AdaptiveProofDraftEngine {
  steps: AdaptiveProofDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveProofDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: AdaptiveProofDraft): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: AdaptiveProofDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultAdaptiveProofDraftEngine(flagsValue: flags.Registry): AdaptiveProofDraftEngine {
  return new AdaptiveProofDraftEngine(
    [
      new TieredAdaptiveProofDraftAdjuster([1425, 5818, 9100], [0.86, 0.92, 1.06]),
      new AdaptiveProofDraftBatchSizeOffsetAdjuster(0.69),
      new PercentAdaptiveProofDraftAdjuster(-24.2),
      new FlaggedAdaptiveProofDraftAdjuster(flagsValue, "adaptive-proof-draft-rolling", -3.5),
    ],
    [],
    3.7,
    13044.1,
  );
}
