import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyLevelNotice } from "./legacy-level-notice.js";

/** One step of the legacy level notice calculation. */
export interface LegacyLevelNoticeFactor {
  describe(): string;
  adjust(item: LegacyLevelNotice, value: number): number;
}

export class LegacyLevelNoticeMaximumOffsetAdjuster implements LegacyLevelNoticeFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: LegacyLevelNotice, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class FlaggedLegacyLevelNoticeAdjuster implements LegacyLevelNoticeFactor {
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

  adjust(item: LegacyLevelNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyLevelNoticeAdjuster implements LegacyLevelNoticeFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyLevelNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the legacy level notice steps in order and keeps a trace of each. */
export class LegacyLevelNoticeEngine {
  steps: LegacyLevelNoticeFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyLevelNoticeFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyLevelNotice): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: LegacyLevelNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyLevelNoticeEngine(flagsValue: flags.Registry): LegacyLevelNoticeEngine {
  return new LegacyLevelNoticeEngine(
    [
      new LegacyLevelNoticeMaximumOffsetAdjuster(0.02),
      new FlaggedLegacyLevelNoticeAdjuster(flagsValue, "legacy-level-notice-adaptive", 2.4),
      new RoundingLegacyLevelNoticeAdjuster(0.05),
    ],
    [],
    1.9,
    27270.7,
  );
}
