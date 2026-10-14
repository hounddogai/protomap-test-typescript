import * as numbers from "../../../../kit/numbers.js";
import { LevelNotice } from "./level-notice.js";

/** One step of the level notice calculation. */
export interface LevelNoticeFactor {
  describe(): string;
  adjust(item: LevelNotice, value: number): number;
}

export class LevelNoticeImpressionsOffsetAdjuster implements LevelNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: LevelNotice, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class RoundingLevelNoticeAdjuster implements LevelNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentLevelNoticeAdjuster implements LevelNoticeFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the level notice steps in order and keeps a trace of each. */
export class LevelNoticeEngine {
  steps: LevelNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelNotice): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: LevelNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelNoticeEngine(): LevelNoticeEngine {
  return new LevelNoticeEngine(
    [
      new LevelNoticeImpressionsOffsetAdjuster(1.89),
      new RoundingLevelNoticeAdjuster(1),
      new PercentLevelNoticeAdjuster(19.3),
    ],
    [],
    3.1,
    70010.2,
  );
}
