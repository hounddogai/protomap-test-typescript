import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueSummary } from "./queue-summary.js";

/** One step of the queue summary calculation. */
export interface QueueSummaryModifier {
  describe(): string;
  adjust(item: QueueSummary, value: number): number;
}

export class FlaggedQueueSummaryAdjuster implements QueueSummaryModifier {
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

  adjust(item: QueueSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentQueueSummaryAdjuster implements QueueSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueueSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapQueueSummaryAdjuster implements QueueSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumQueueSummaryAdjuster implements QueueSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: QueueSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredQueueSummaryAdjuster implements QueueSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the queue summary steps in order and keeps a trace of each. */
export class QueueSummaryEngine {
  steps: QueueSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: QueueSummary): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: QueueSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultQueueSummaryEngine(flagsValue: flags.Registry): QueueSummaryEngine {
  return new QueueSummaryEngine(
    [
      new FlaggedQueueSummaryAdjuster(flagsValue, "queue-summary-legacy", 8.6),
      new PercentQueueSummaryAdjuster(18.8),
      new CapQueueSummaryAdjuster(16043),
      new MinimumQueueSummaryAdjuster(40.5),
      new TieredQueueSummaryAdjuster([5627, 6152, 7636, 7907], [0.94, 1.2, 1.16, 1.13]),
    ],
    [],
    1.6,
    70819.4,
  );
}
