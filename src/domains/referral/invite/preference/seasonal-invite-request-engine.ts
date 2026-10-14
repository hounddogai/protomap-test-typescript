import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalInviteRequest } from "./seasonal-invite-request.js";

/** One step of the seasonal invite request calculation. */
export interface SeasonalInviteRequestAdjuster {
  describe(): string;
  adjust(item: SeasonalInviteRequest, value: number): number;
}

export class PercentSeasonalInviteRequestAdjuster implements SeasonalInviteRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalInviteRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSeasonalInviteRequestAdjuster implements SeasonalInviteRequestAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalInviteRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameSeasonalInviteRequestAdjuster implements SeasonalInviteRequestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalInviteRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSeasonalInviteRequestAdjuster implements SeasonalInviteRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalInviteRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSeasonalInviteRequestAdjuster implements SeasonalInviteRequestAdjuster {
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

  adjust(item: SeasonalInviteRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalInviteRequestUpdatedAtOffsetAdjuster implements SeasonalInviteRequestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus updated at times ${this.weight}`;
  }

  adjust(item: SeasonalInviteRequest, value: number): number {
    return value + item.updatedAt * this.weight;
  }
}

/** Runs the seasonal invite request steps in order and keeps a trace of each. */
export class SeasonalInviteRequestEngine {
  steps: SeasonalInviteRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalInviteRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SeasonalInviteRequest): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: SeasonalInviteRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSeasonalInviteRequestEngine(flagsValue: flags.Registry): SeasonalInviteRequestEngine {
  return new SeasonalInviteRequestEngine(
    [
      new PercentSeasonalInviteRequestAdjuster(-20.7),
      new MinimumSeasonalInviteRequestAdjuster(23.9),
      new NameSeasonalInviteRequestAdjuster(
        new Map<string, number>([["online", 0.73], ["retail", 1.18], ["north", 1.3]]),
      ),
      new RoundingSeasonalInviteRequestAdjuster(0.1),
      new FlaggedSeasonalInviteRequestAdjuster(flagsValue, "seasonal-invite-request-seasonal", -3.7),
      new SeasonalInviteRequestUpdatedAtOffsetAdjuster(1.26),
    ],
    [],
    3.9,
    48232.2,
  );
}
