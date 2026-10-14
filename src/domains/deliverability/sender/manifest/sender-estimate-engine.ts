import * as flags from "../../../../kit/flags.js";
import { SenderEstimate } from "./sender-estimate.js";

/** One step of the sender estimate calculation. */
export interface SenderEstimateStep {
  describe(): string;
  adjust(item: SenderEstimate, value: number): number;
}

export class CapSenderEstimateAdjuster implements SenderEstimateStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SenderEstimateUpdatedAtOffsetAdjuster implements SenderEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: SenderEstimate, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

export class FlaggedSenderEstimateAdjuster implements SenderEstimateStep {
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

  adjust(item: SenderEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sender estimate steps in order and keeps a trace of each. */
export class SenderEstimateEngine {
  steps: SenderEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SenderEstimate): number {
    let current = item.weightedValue();
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

  evaluateAll(items: SenderEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSenderEstimateEngine(flagsValue: flags.Registry): SenderEstimateEngine {
  return new SenderEstimateEngine(
    [
      new CapSenderEstimateAdjuster(11452),
      new SenderEstimateUpdatedAtOffsetAdjuster(0.45),
      new FlaggedSenderEstimateAdjuster(flagsValue, "sender-estimate-fallback", 0.9),
    ],
    [],
    4,
    99842.2,
  );
}
