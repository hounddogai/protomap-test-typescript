import * as numbers from "../../../../kit/numbers.js";
import { GlobalFrequencyClaim } from "./global-frequency-claim.js";

/** One step of the global frequency claim calculation. */
export interface GlobalFrequencyClaimStep {
  describe(): string;
  adjust(item: GlobalFrequencyClaim, value: number): number;
}

export class CapGlobalFrequencyClaimAdjuster implements GlobalFrequencyClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalFrequencyClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingGlobalFrequencyClaimAdjuster implements GlobalFrequencyClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalFrequencyClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelGlobalFrequencyClaimAdjuster implements GlobalFrequencyClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: GlobalFrequencyClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global frequency claim steps in order and keeps a trace of each. */
export class GlobalFrequencyClaimEngine {
  steps: GlobalFrequencyClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalFrequencyClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalFrequencyClaim): number {
    let current = item.netLoad();
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

  evaluateAll(items: GlobalFrequencyClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalFrequencyClaimEngine(): GlobalFrequencyClaimEngine {
  return new GlobalFrequencyClaimEngine(
    [
      new CapGlobalFrequencyClaimAdjuster(30927),
      new RoundingGlobalFrequencyClaimAdjuster(0.5),
      new LabelGlobalFrequencyClaimAdjuster(new Map<string, number>([["central", 0.71], ["north", 0.96]])),
    ],
    [],
    3.7,
    40623.1,
  );
}
