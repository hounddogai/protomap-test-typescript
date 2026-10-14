import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalSenderRequest } from "./global-sender-request.js";

/** One step of the global sender request calculation. */
export interface GlobalSenderRequestStep {
  describe(): string;
  adjust(item: GlobalSenderRequest, value: number): number;
}

export class CapGlobalSenderRequestAdjuster implements GlobalSenderRequestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalSenderRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalSenderRequestVersionOffsetAdjuster implements GlobalSenderRequestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: GlobalSenderRequest, value: number): number {
    return value + item.version * this.weight;
  }
}

export class PercentGlobalSenderRequestAdjuster implements GlobalSenderRequestStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalSenderRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalSenderRequestAdjuster implements GlobalSenderRequestStep {
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

  adjust(item: GlobalSenderRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingGlobalSenderRequestAdjuster implements GlobalSenderRequestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalSenderRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameGlobalSenderRequestAdjuster implements GlobalSenderRequestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalSenderRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global sender request steps in order and keeps a trace of each. */
export class GlobalSenderRequestEngine {
  steps: GlobalSenderRequestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalSenderRequestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: GlobalSenderRequest): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: GlobalSenderRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultGlobalSenderRequestEngine(flagsValue: flags.Registry): GlobalSenderRequestEngine {
  return new GlobalSenderRequestEngine(
    [
      new CapGlobalSenderRequestAdjuster(11275),
      new GlobalSenderRequestVersionOffsetAdjuster(1.22),
      new PercentGlobalSenderRequestAdjuster(-18.1),
      new FlaggedGlobalSenderRequestAdjuster(flagsValue, "global-sender-request-pending", 3.8),
      new RoundingGlobalSenderRequestAdjuster(1),
      new NameGlobalSenderRequestAdjuster(new Map<string, number>([["south", 0.71]])),
    ],
    [],
    1.4,
    98064.6,
  );
}
