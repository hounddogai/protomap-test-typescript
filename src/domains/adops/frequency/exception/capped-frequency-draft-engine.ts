import * as numbers from "../../../../kit/numbers.js";
import { CappedFrequencyDraft } from "./capped-frequency-draft.js";

/** One step of the capped frequency draft calculation. */
export interface CappedFrequencyDraftFactor {
  describe(): string;
  adjust(item: CappedFrequencyDraft, value: number): number;
}

export class CappedFrequencyDraftVersionOffsetAdjuster implements CappedFrequencyDraftFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: CappedFrequencyDraft, value: number): number {
    return value + item.version * this.weight;
  }
}

export class MinimumCappedFrequencyDraftAdjuster implements CappedFrequencyDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedFrequencyDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ChannelCappedFrequencyDraftAdjuster implements CappedFrequencyDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: CappedFrequencyDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapCappedFrequencyDraftAdjuster implements CappedFrequencyDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedFrequencyDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the capped frequency draft steps in order and keeps a trace of each. */
export class CappedFrequencyDraftEngine {
  steps: CappedFrequencyDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedFrequencyDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CappedFrequencyDraft): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: CappedFrequencyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCappedFrequencyDraftEngine(): CappedFrequencyDraftEngine {
  return new CappedFrequencyDraftEngine(
    [
      new CappedFrequencyDraftVersionOffsetAdjuster(0.65),
      new MinimumCappedFrequencyDraftAdjuster(45.4),
      new ChannelCappedFrequencyDraftAdjuster(new Map<string, number>([["central", 1.14]])),
      new CapCappedFrequencyDraftAdjuster(12733),
    ],
    [],
    0.1,
    92320.3,
  );
}
