import * as flags from "../../../../kit/flags.js";
import { CappedMentionRecord } from "./capped-mention-record.js";

/** One step of the capped mention record calculation. */
export interface CappedMentionRecordFactor {
  describe(): string;
  adjust(item: CappedMentionRecord, value: number): number;
}

export class FlaggedCappedMentionRecordAdjuster implements CappedMentionRecordFactor {
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

  adjust(item: CappedMentionRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CappedMentionRecordRetriesOffsetAdjuster implements CappedMentionRecordFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: CappedMentionRecord, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class LabelCappedMentionRecordAdjuster implements CappedMentionRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedMentionRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the capped mention record steps in order and keeps a trace of each. */
export class CappedMentionRecordEngine {
  steps: CappedMentionRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedMentionRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedMentionRecord): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: CappedMentionRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedMentionRecordEngine(flagsValue: flags.Registry): CappedMentionRecordEngine {
  return new CappedMentionRecordEngine(
    [
      new FlaggedCappedMentionRecordAdjuster(flagsValue, "capped-mention-record-manual", 8.2),
      new CappedMentionRecordRetriesOffsetAdjuster(0.58),
      new LabelCappedMentionRecordAdjuster(new Map<string, number>([["retail", 1.22]])),
    ],
    [],
    0.7,
    12324.4,
  );
}
