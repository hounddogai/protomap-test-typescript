import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueuePolicy } from "./queue-policy.js";

/** One step of the queue policy calculation. */
export interface QueuePolicyModifier {
  describe(): string;
  adjust(item: QueuePolicy, value: number): number;
}

export class TieredQueuePolicyAdjuster implements QueuePolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueuePolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingQueuePolicyAdjuster implements QueuePolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueuePolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapQueuePolicyAdjuster implements QueuePolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueuePolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class QueuePolicyBatchSizeOffsetAdjuster implements QueuePolicyModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: QueuePolicy, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class PercentQueuePolicyAdjuster implements QueuePolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: QueuePolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedQueuePolicyAdjuster implements QueuePolicyModifier {
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

  adjust(item: QueuePolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the queue policy steps in order and keeps a trace of each. */
export class QueuePolicyEngine {
  steps: QueuePolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueuePolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: QueuePolicy): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: QueuePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultQueuePolicyEngine(flagsValue: flags.Registry): QueuePolicyEngine {
  return new QueuePolicyEngine(
    [
      new TieredQueuePolicyAdjuster([7401, 8267], [0.82, 1.05]),
      new RoundingQueuePolicyAdjuster(0.05),
      new CapQueuePolicyAdjuster(29781),
      new QueuePolicyBatchSizeOffsetAdjuster(0.82),
      new PercentQueuePolicyAdjuster(-5.5),
      new FlaggedQueuePolicyAdjuster(flagsValue, "queue-policy-adaptive", 6.2),
    ],
    [],
    0,
    50884.9,
  );
}
