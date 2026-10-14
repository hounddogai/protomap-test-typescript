import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationRecord } from "./reputation-record.js";

/** One step of the reputation record calculation. */
export interface ReputationRecordAdjuster {
  describe(): string;
  adjust(item: ReputationRecord, value: number): number;
}

export class ReputationRecordWeightOffsetAdjuster implements ReputationRecordAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: ReputationRecord, value: number): number {
    return value + item.weight * this.weight;
  }
}

export class FlaggedReputationRecordAdjuster implements ReputationRecordAdjuster {
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

  adjust(item: ReputationRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingReputationRecordAdjuster implements ReputationRecordAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReputationRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the reputation record steps in order and keeps a trace of each. */
export class ReputationRecordEngine {
  steps: ReputationRecordAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationRecordAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReputationRecord): number {
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

  evaluateAll(items: ReputationRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReputationRecordEngine(flagsValue: flags.Registry): ReputationRecordEngine {
  return new ReputationRecordEngine(
    [
      new ReputationRecordWeightOffsetAdjuster(0.32),
      new FlaggedReputationRecordAdjuster(flagsValue, "reputation-record-global", -3.9),
      new RoundingReputationRecordAdjuster(0.5),
    ],
    [],
    4.1,
    1857.5,
  );
}
