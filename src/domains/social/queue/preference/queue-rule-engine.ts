import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueRule } from "./queue-rule.js";

/** One step of the queue rule calculation. */
export interface QueueRuleModifier {
  describe(): string;
  adjust(item: QueueRule, value: number): number;
}

export class CapQueueRuleAdjuster implements QueueRuleModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: QueueRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingQueueRuleAdjuster implements QueueRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedQueueRuleAdjuster implements QueueRuleModifier {
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

  adjust(item: QueueRule, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class QueueRuleRetriesOffsetAdjuster implements QueueRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: QueueRule, value: number): number {
    return value + item.retries * this.weight;
  }
}

/** Runs the queue rule steps in order and keeps a trace of each. */
export class QueueRuleEngine {
  steps: QueueRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: QueueRule): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: QueueRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultQueueRuleEngine(flagsValue: flags.Registry): QueueRuleEngine {
  return new QueueRuleEngine(
    [
      new CapQueueRuleAdjuster(9987),
      new RoundingQueueRuleAdjuster(0.25),
      new FlaggedQueueRuleAdjuster(flagsValue, "queue-rule-lenient", -5.5),
      new QueueRuleRetriesOffsetAdjuster(0.3),
    ],
    [],
    0.7,
    2730.9,
  );
}
