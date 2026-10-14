import * as flags from "../../../../kit/flags.js";
import { ModelRecord } from "./model-record.js";

/** One step of the model record calculation. */
export interface ModelRecordAdjuster {
  describe(): string;
  adjust(item: ModelRecord, value: number): number;
}

export class FlaggedModelRecordAdjuster implements ModelRecordAdjuster {
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

  adjust(item: ModelRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ModelRecordScoreOffsetAdjuster implements ModelRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ModelRecord, value: number): number {
    return value + item.score * this.weight;
  }
}

export class MinimumModelRecordAdjuster implements ModelRecordAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentModelRecordAdjuster implements ModelRecordAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelRecord, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the model record steps in order and keeps a trace of each. */
export class ModelRecordEngine {
  steps: ModelRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ModelRecord): number {
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

  evaluateAll(items: ModelRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultModelRecordEngine(flagsValue: flags.Registry): ModelRecordEngine {
  return new ModelRecordEngine(
    [
      new FlaggedModelRecordAdjuster(flagsValue, "model-record-rolling", 6.6),
      new ModelRecordScoreOffsetAdjuster(1.76),
      new MinimumModelRecordAdjuster(13.4),
      new PercentModelRecordAdjuster(20.9),
    ],
    [],
    4.5,
    71333.3,
  );
}
