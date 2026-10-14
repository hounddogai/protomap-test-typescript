import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueVariance } from "./queue-variance.js";

/** One step of the queue variance calculation. */
export interface QueueVarianceAdjuster {
  describe(): string;
  adjust(item: QueueVariance, value: number): number;
}

export class LabelQueueVarianceAdjuster implements QueueVarianceAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: QueueVariance, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedQueueVarianceAdjuster implements QueueVarianceAdjuster {
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

  adjust(item: QueueVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingQueueVarianceAdjuster implements QueueVarianceAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueVariance, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the queue variance steps in order and keeps a trace of each. */
export class QueueVarianceEngine {
  steps: QueueVarianceAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueVarianceAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: QueueVariance): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: QueueVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultQueueVarianceEngine(flagsValue: flags.Registry): QueueVarianceEngine {
  return new QueueVarianceEngine(
    [
      new LabelQueueVarianceAdjuster(new Map<string, number>([["east", 1.27]])),
      new FlaggedQueueVarianceAdjuster(flagsValue, "queue-variance-capped", -9.9),
      new RoundingQueueVarianceAdjuster(5),
    ],
    [],
    3.7,
    68373.9,
  );
}
