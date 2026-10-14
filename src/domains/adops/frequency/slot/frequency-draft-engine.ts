import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FrequencyDraft } from "./frequency-draft.js";

/** One step of the frequency draft calculation. */
export interface FrequencyDraftFactor {
  describe(): string;
  adjust(item: FrequencyDraft, value: number): number;
}

export class MinimumFrequencyDraftAdjuster implements FrequencyDraftFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FrequencyDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredFrequencyDraftAdjuster implements FrequencyDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FrequencyDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFrequencyDraftAdjuster implements FrequencyDraftFactor {
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

  adjust(item: FrequencyDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFrequencyDraftAdjuster implements FrequencyDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FrequencyDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapFrequencyDraftAdjuster implements FrequencyDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FrequencyDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the frequency draft steps in order and keeps a trace of each. */
export class FrequencyDraftEngine {
  steps: FrequencyDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FrequencyDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FrequencyDraft): number {
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

  evaluateAll(items: FrequencyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFrequencyDraftEngine(flagsValue: flags.Registry): FrequencyDraftEngine {
  return new FrequencyDraftEngine(
    [
      new MinimumFrequencyDraftAdjuster(15.4),
      new TieredFrequencyDraftAdjuster([240, 6054, 7795, 9479], [0.93, 1.18, 0.95, 1.05]),
      new FlaggedFrequencyDraftAdjuster(flagsValue, "frequency-draft-tiered", -3.1),
      new RoundingFrequencyDraftAdjuster(0.1),
      new CapFrequencyDraftAdjuster(28776),
    ],
    [],
    2.8,
    73096.2,
  );
}
