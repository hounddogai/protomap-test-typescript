import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultSenderDraft } from "./default-sender-draft.js";

/** One step of the default sender draft calculation. */
export interface DefaultSenderDraftFactor {
  describe(): string;
  adjust(item: DefaultSenderDraft, value: number): number;
}

export class NameDefaultSenderDraftAdjuster implements DefaultSenderDraftFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultSenderDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapDefaultSenderDraftAdjuster implements DefaultSenderDraftFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultSenderDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultSenderDraftAdjuster implements DefaultSenderDraftFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultSenderDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDefaultSenderDraftAdjuster implements DefaultSenderDraftFactor {
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

  adjust(item: DefaultSenderDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDefaultSenderDraftAdjuster implements DefaultSenderDraftFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultSenderDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the default sender draft steps in order and keeps a trace of each. */
export class DefaultSenderDraftEngine {
  steps: DefaultSenderDraftFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultSenderDraftFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultSenderDraft): number {
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

  evaluateAll(items: DefaultSenderDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultSenderDraftEngine(flagsValue: flags.Registry): DefaultSenderDraftEngine {
  return new DefaultSenderDraftEngine(
    [
      new NameDefaultSenderDraftAdjuster(
        new Map<string, number>([["retail", 0.94], ["east", 1.08], ["central", 1.21]]),
      ),
      new CapDefaultSenderDraftAdjuster(8163),
      new RoundingDefaultSenderDraftAdjuster(0.1),
      new FlaggedDefaultSenderDraftAdjuster(flagsValue, "default-sender-draft-weighted", 1.2),
      new TieredDefaultSenderDraftAdjuster([2979, 3093, 4896, 8012], [1.15, 0.87, 1, 0.88]),
    ],
    [],
    3.2,
    21982,
  );
}
