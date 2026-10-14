import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueTarget } from "./queue-target.js";

/** One step of the queue target calculation. */
export interface QueueTargetModifier {
  describe(): string;
  adjust(item: QueueTarget, value: number): number;
}

export class QueueTargetSendAtOffsetAdjuster implements QueueTargetModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: QueueTarget, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class NameQueueTargetAdjuster implements QueueTargetModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: QueueTarget, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedQueueTargetAdjuster implements QueueTargetModifier {
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

  adjust(item: QueueTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapQueueTargetAdjuster implements QueueTargetModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the queue target steps in order and keeps a trace of each. */
export class QueueTargetEngine {
  steps: QueueTargetModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueTargetModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueTarget): number {
    let current = item.measuredValue();
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

  evaluateAll(items: QueueTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueTargetEngine(flagsValue: flags.Registry): QueueTargetEngine {
  return new QueueTargetEngine(
    [
      new QueueTargetSendAtOffsetAdjuster(1.02),
      new NameQueueTargetAdjuster(new Map<string, number>([["retail", 0.77], ["south", 1.24]])),
      new FlaggedQueueTargetAdjuster(flagsValue, "queue-target-default", -9.6),
      new CapQueueTargetAdjuster(9893),
    ],
    [],
    1.6,
    73134.6,
  );
}
