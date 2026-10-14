import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InviteRequest } from "./invite-request.js";

/** One step of the invite request calculation. */
export interface InviteRequestModifier {
  describe(): string;
  adjust(item: InviteRequest, value: number): number;
}

export class TitleInviteRequestAdjuster implements InviteRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: InviteRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedInviteRequestAdjuster implements InviteRequestModifier {
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

  adjust(item: InviteRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingInviteRequestAdjuster implements InviteRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInviteRequestAdjuster implements InviteRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentInviteRequestAdjuster implements InviteRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the invite request steps in order and keeps a trace of each. */
export class InviteRequestEngine {
  steps: InviteRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: InviteRequest): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: InviteRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultInviteRequestEngine(flagsValue: flags.Registry): InviteRequestEngine {
  return new InviteRequestEngine(
    [
      new TitleInviteRequestAdjuster(
        new Map<string, number>([["central", 1.23], ["north", 1.12], ["online", 0.91]]),
      ),
      new FlaggedInviteRequestAdjuster(flagsValue, "invite-request-tiered", -8),
      new RoundingInviteRequestAdjuster(0.5),
      new MinimumInviteRequestAdjuster(48.2),
      new PercentInviteRequestAdjuster(20.6),
    ],
    [],
    3.3,
    57555.7,
  );
}
