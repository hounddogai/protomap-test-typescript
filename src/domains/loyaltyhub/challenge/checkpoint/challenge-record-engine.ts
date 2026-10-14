import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ChallengeRecord } from "./challenge-record.js";

/** One step of the challenge record calculation. */
export interface ChallengeRecordFactor {
  describe(): string;
  adjust(item: ChallengeRecord, value: number): number;
}

export class FlaggedChallengeRecordAdjuster implements ChallengeRecordFactor {
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

  adjust(item: ChallengeRecord, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelChallengeRecordAdjuster implements ChallengeRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: ChallengeRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingChallengeRecordAdjuster implements ChallengeRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumChallengeRecordAdjuster implements ChallengeRecordFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeRecord, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the challenge record steps in order and keeps a trace of each. */
export class ChallengeRecordEngine {
  steps: ChallengeRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ChallengeRecord): number {
    let current = item.netExposure();
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

  evaluateAll(items: ChallengeRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultChallengeRecordEngine(flagsValue: flags.Registry): ChallengeRecordEngine {
  return new ChallengeRecordEngine(
    [
      new FlaggedChallengeRecordAdjuster(flagsValue, "challenge-record-seasonal", 9.6),
      new LabelChallengeRecordAdjuster(new Map<string, number>([["online", 0.86]])),
      new RoundingChallengeRecordAdjuster(0.05),
      new MinimumChallengeRecordAdjuster(12.5),
    ],
    [],
    0,
    10918.3,
  );
}
