import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalReplyAgreement } from "./regional-reply-agreement.js";

/** One step of the regional reply agreement calculation. */
export interface RegionalReplyAgreementAdjuster {
  describe(): string;
  adjust(item: RegionalReplyAgreement, value: number): number;
}

export class TitleRegionalReplyAgreementAdjuster implements RegionalReplyAgreementAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalReplyAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRegionalReplyAgreementAdjuster implements RegionalReplyAgreementAdjuster {
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

  adjust(item: RegionalReplyAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRegionalReplyAgreementAdjuster implements RegionalReplyAgreementAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalReplyAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRegionalReplyAgreementAdjuster implements RegionalReplyAgreementAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalReplyAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the regional reply agreement steps in order and keeps a trace of each. */
export class RegionalReplyAgreementEngine {
  steps: RegionalReplyAgreementAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalReplyAgreementAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RegionalReplyAgreement): number {
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

  evaluateAll(items: RegionalReplyAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRegionalReplyAgreementEngine(flagsValue: flags.Registry): RegionalReplyAgreementEngine {
  return new RegionalReplyAgreementEngine(
    [
      new TitleRegionalReplyAgreementAdjuster(new Map<string, number>([["west", 0.96], ["retail", 0.84]])),
      new FlaggedRegionalReplyAgreementAdjuster(flagsValue, "regional-reply-agreement-strict", 8.9),
      new RoundingRegionalReplyAgreementAdjuster(1),
      new MinimumRegionalReplyAgreementAdjuster(11.8),
    ],
    [],
    4.7,
    93875.9,
  );
}
