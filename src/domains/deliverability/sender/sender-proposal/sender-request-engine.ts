import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderRequest } from "./sender-request.js";

/** One step of the sender request calculation. */
export interface SenderRequestFactor {
  describe(): string;
  adjust(item: SenderRequest, value: number): number;
}

export class RoundingSenderRequestAdjuster implements SenderRequestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentSenderRequestAdjuster implements SenderRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSenderRequestAdjuster implements SenderRequestFactor {
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

  adjust(item: SenderRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleSenderRequestAdjuster implements SenderRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: SenderRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class SenderRequestDurationMinutesOffsetAdjuster implements SenderRequestFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: SenderRequest, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class CapSenderRequestAdjuster implements SenderRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the sender request steps in order and keeps a trace of each. */
export class SenderRequestEngine {
  steps: SenderRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SenderRequest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: SenderRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSenderRequestEngine(flagsValue: flags.Registry): SenderRequestEngine {
  return new SenderRequestEngine(
    [
      new RoundingSenderRequestAdjuster(5),
      new PercentSenderRequestAdjuster(-13.3),
      new FlaggedSenderRequestAdjuster(flagsValue, "sender-request-lenient", 7.9),
      new TitleSenderRequestAdjuster(
        new Map<string, number>([["south", 0.81], ["north", 1.27], ["east", 1.16]]),
      ),
      new SenderRequestDurationMinutesOffsetAdjuster(1.84),
      new CapSenderRequestAdjuster(8430),
    ],
    [],
    4.1,
    76680.8,
  );
}
