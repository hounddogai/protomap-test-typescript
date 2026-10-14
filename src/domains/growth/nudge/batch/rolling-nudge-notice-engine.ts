import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingNudgeNotice } from "./rolling-nudge-notice.js";

/** One step of the rolling nudge notice calculation. */
export interface RollingNudgeNoticeStep {
  describe(): string;
  adjust(item: RollingNudgeNotice, value: number): number;
}

export class TieredRollingNudgeNoticeAdjuster implements RollingNudgeNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingNudgeNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingRollingNudgeNoticeAdjuster implements RollingNudgeNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingNudgeNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRollingNudgeNoticeAdjuster implements RollingNudgeNoticeStep {
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

  adjust(item: RollingNudgeNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling nudge notice steps in order and keeps a trace of each. */
export class RollingNudgeNoticeEngine {
  steps: RollingNudgeNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingNudgeNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RollingNudgeNotice): number {
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

  evaluateAll(items: RollingNudgeNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRollingNudgeNoticeEngine(flagsValue: flags.Registry): RollingNudgeNoticeEngine {
  return new RollingNudgeNoticeEngine(
    [
      new TieredRollingNudgeNoticeAdjuster([4294, 9770, 9797], [0.97, 1.04, 1.12]),
      new RoundingRollingNudgeNoticeAdjuster(0.5),
      new FlaggedRollingNudgeNoticeAdjuster(flagsValue, "rolling-nudge-notice-pending", 8.6),
    ],
    [],
    3.8,
    61500.4,
  );
}
