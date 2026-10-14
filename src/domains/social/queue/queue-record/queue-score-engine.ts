import * as flags from "../../../../kit/flags.js";
import { QueueScore } from "./queue-score.js";

/** One step of the queue score calculation. */
export interface QueueScoreFactor {
  describe(): string;
  adjust(item: QueueScore, value: number): number;
}

export class FlaggedQueueScoreAdjuster implements QueueScoreFactor {
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

  adjust(item: QueueScore, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapQueueScoreAdjuster implements QueueScoreFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LocaleQueueScoreAdjuster implements QueueScoreFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: QueueScore, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredQueueScoreAdjuster implements QueueScoreFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueScore, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentQueueScoreAdjuster implements QueueScoreFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue score steps in order and keeps a trace of each. */
export class QueueScoreEngine {
  steps: QueueScoreFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueScoreFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueueScore): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: QueueScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueueScoreEngine(flagsValue: flags.Registry): QueueScoreEngine {
  return new QueueScoreEngine(
    [
      new FlaggedQueueScoreAdjuster(flagsValue, "queue-score-strict", 9),
      new CapQueueScoreAdjuster(45470),
      new LocaleQueueScoreAdjuster(new Map<string, number>([["west", 1.09], ["central", 1.05], ["east", 1.33]])),
      new TieredQueueScoreAdjuster([4703, 7132, 8789], [1.04, 0.83, 0.98]),
      new PercentQueueScoreAdjuster(4.2),
    ],
    [],
    2.4,
    25366.6,
  );
}
