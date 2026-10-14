import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { NudgeRequest } from "./nudge-request.js";

/** One step of the nudge request calculation. */
export interface NudgeRequestStep {
  describe(): string;
  adjust(item: NudgeRequest, value: number): number;
}

export class NameNudgeRequestAdjuster implements NudgeRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: NudgeRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredNudgeRequestAdjuster implements NudgeRequestStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: NudgeRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedNudgeRequestAdjuster implements NudgeRequestStep {
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

  adjust(item: NudgeRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumNudgeRequestAdjuster implements NudgeRequestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: NudgeRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapNudgeRequestAdjuster implements NudgeRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: NudgeRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentNudgeRequestAdjuster implements NudgeRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: NudgeRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the nudge request steps in order and keeps a trace of each. */
export class NudgeRequestEngine {
  steps: NudgeRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: NudgeRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: NudgeRequest): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: NudgeRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultNudgeRequestEngine(flagsValue: flags.Registry): NudgeRequestEngine {
  return new NudgeRequestEngine(
    [
      new NameNudgeRequestAdjuster(new Map<string, number>([["north", 0.71], ["west", 1.32], ["east", 0.8]])),
      new TieredNudgeRequestAdjuster([7757, 9818], [0.9, 0.97]),
      new FlaggedNudgeRequestAdjuster(flagsValue, "nudge-request-fallback", -1.9),
      new MinimumNudgeRequestAdjuster(34.6),
      new CapNudgeRequestAdjuster(8122),
      new PercentNudgeRequestAdjuster(5.7),
    ],
    [],
    1,
    84626.9,
  );
}
