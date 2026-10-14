import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionAudit } from "./mention-audit.js";

/** One step of the mention audit calculation. */
export interface MentionAuditFactor {
  describe(): string;
  adjust(item: MentionAudit, value: number): number;
}

export class FlaggedMentionAuditAdjuster implements MentionAuditFactor {
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

  adjust(item: MentionAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelMentionAuditAdjuster implements MentionAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: MentionAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingMentionAuditAdjuster implements MentionAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: MentionAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumMentionAuditAdjuster implements MentionAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MentionAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the mention audit steps in order and keeps a trace of each. */
export class MentionAuditEngine {
  steps: MentionAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MentionAudit): number {
    let current = item.measuredValue();
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

  evaluateAll(items: MentionAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMentionAuditEngine(flagsValue: flags.Registry): MentionAuditEngine {
  return new MentionAuditEngine(
    [
      new FlaggedMentionAuditAdjuster(flagsValue, "mention-audit-pending", -4.5),
      new LabelMentionAuditAdjuster(new Map<string, number>([["retail", 0.86], ["south", 0.72]])),
      new RoundingMentionAuditAdjuster(0.1),
      new MinimumMentionAuditAdjuster(41.6),
    ],
    [],
    2.3,
    80724.4,
  );
}
