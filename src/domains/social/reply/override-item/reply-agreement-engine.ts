import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReplyAgreement } from "./reply-agreement.js";

/** One step of the reply agreement calculation. */
export interface ReplyAgreementModifier {
  describe(): string;
  adjust(item: ReplyAgreement, value: number): number;
}

export class FlaggedReplyAgreementAdjuster implements ReplyAgreementModifier {
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

  adjust(item: ReplyAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ReplyAgreementPriorityOffsetAdjuster implements ReplyAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ReplyAgreement, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class CapReplyAgreementAdjuster implements ReplyAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ReplyAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reply agreement steps in order and keeps a trace of each. */
export class ReplyAgreementEngine {
  steps: ReplyAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ReplyAgreement): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: ReplyAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultReplyAgreementEngine(flagsValue: flags.Registry): ReplyAgreementEngine {
  return new ReplyAgreementEngine(
    [
      new FlaggedReplyAgreementAdjuster(flagsValue, "reply-agreement-seasonal", -3.8),
      new ReplyAgreementPriorityOffsetAdjuster(0.39),
      new CapReplyAgreementAdjuster(20635),
    ],
    [],
    3.3,
    70420.9,
  );
}
