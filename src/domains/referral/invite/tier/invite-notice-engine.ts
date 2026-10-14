import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteNotice } from "./invite-notice.js";

/** One step of the invite notice calculation. */
export interface InviteNoticeStep {
  describe(): string;
  adjust(item: InviteNotice, value: number): number;
}

export class FlaggedInviteNoticeAdjuster implements InviteNoticeStep {
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

  adjust(item: InviteNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredInviteNoticeAdjuster implements InviteNoticeStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteNotice, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInviteNoticeAdjuster implements InviteNoticeStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteNotice, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInviteNoticeAdjuster implements InviteNoticeStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class LabelInviteNoticeAdjuster implements InviteNoticeStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: InviteNotice, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the invite notice steps in order and keeps a trace of each. */
export class InviteNoticeEngine {
  steps: InviteNoticeStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteNoticeStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InviteNotice): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: InviteNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInviteNoticeEngine(flagsValue: flags.Registry): InviteNoticeEngine {
  return new InviteNoticeEngine(
    [
      new FlaggedInviteNoticeAdjuster(flagsValue, "invite-notice-adaptive", 3.1),
      new TieredInviteNoticeAdjuster([6565, 7220], [0.84, 0.85]),
      new PercentInviteNoticeAdjuster(-19.5),
      new RoundingInviteNoticeAdjuster(0.1),
      new LabelInviteNoticeAdjuster(new Map<string, number>([["east", 1.08], ["online", 1.34]])),
    ],
    [],
    2.3,
    62981.9,
  );
}
