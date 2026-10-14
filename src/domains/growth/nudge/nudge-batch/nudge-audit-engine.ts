import { NudgeAudit } from "./nudge-audit.js";

/** One step of the nudge audit calculation. */
export interface NudgeAuditModifier {
  describe(): string;
  adjust(item: NudgeAudit, value: number): number;
}

export class NudgeAuditSequenceOffsetAdjuster implements NudgeAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: NudgeAudit, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class PercentNudgeAuditAdjuster implements NudgeAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LocaleNudgeAuditAdjuster implements NudgeAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: NudgeAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the nudge audit steps in order and keeps a trace of each. */
export class NudgeAuditEngine {
  steps: NudgeAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: NudgeAudit): number {
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

  evaluateAll(items: NudgeAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultNudgeAuditEngine(): NudgeAuditEngine {
  return new NudgeAuditEngine(
    [
      new NudgeAuditSequenceOffsetAdjuster(0.51),
      new PercentNudgeAuditAdjuster(20.8),
      new LocaleNudgeAuditAdjuster(new Map<string, number>([["west", 0.9]])),
    ],
    [],
    0.3,
    11725.3,
  );
}
