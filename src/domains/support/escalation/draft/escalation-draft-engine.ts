import * as flags from "../../../../kit/flags.js";
import { EscalationDraft } from "./escalation-draft.js";

/** One step of the escalation draft calculation. */
export interface EscalationDraftModifier {
  describe(): string;
  adjust(item: EscalationDraft, value: number): number;
}

export class PercentEscalationDraftAdjuster implements EscalationDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedEscalationDraftAdjuster implements EscalationDraftModifier {
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

  adjust(item: EscalationDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumEscalationDraftAdjuster implements EscalationDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the escalation draft steps in order and keeps a trace of each. */
export class EscalationDraftEngine {
  steps: EscalationDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: EscalationDraft): number {
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

  evaluateAll(items: EscalationDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultEscalationDraftEngine(flagsValue: flags.Registry): EscalationDraftEngine {
  return new EscalationDraftEngine(
    [
      new PercentEscalationDraftAdjuster(16.9),
      new FlaggedEscalationDraftAdjuster(flagsValue, "escalation-draft-fallback", 0.5),
      new MinimumEscalationDraftAdjuster(46),
    ],
    [],
    1.3,
    80025.9,
  );
}
