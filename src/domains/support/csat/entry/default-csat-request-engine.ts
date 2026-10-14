import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultCsatRequest } from "./default-csat-request.js";

/** One step of the default csat request calculation. */
export interface DefaultCsatRequestModifier {
  describe(): string;
  adjust(item: DefaultCsatRequest, value: number): number;
}

export class PercentDefaultCsatRequestAdjuster implements DefaultCsatRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultCsatRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultCsatRequestAdjuster implements DefaultCsatRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultCsatRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedDefaultCsatRequestAdjuster implements DefaultCsatRequestModifier {
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

  adjust(item: DefaultCsatRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultCsatRequestAdjuster implements DefaultCsatRequestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultCsatRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingDefaultCsatRequestAdjuster implements DefaultCsatRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultCsatRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default csat request steps in order and keeps a trace of each. */
export class DefaultCsatRequestEngine {
  steps: DefaultCsatRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCsatRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: DefaultCsatRequest): number {
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

  evaluateAll(items: DefaultCsatRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultDefaultCsatRequestEngine(flagsValue: flags.Registry): DefaultCsatRequestEngine {
  return new DefaultCsatRequestEngine(
    [
      new PercentDefaultCsatRequestAdjuster(-1.5),
      new MinimumDefaultCsatRequestAdjuster(28.7),
      new FlaggedDefaultCsatRequestAdjuster(flagsValue, "default-csat-request-pending", 7),
      new CapDefaultCsatRequestAdjuster(14875),
      new RoundingDefaultCsatRequestAdjuster(0.25),
    ],
    [],
    4.6,
    78708.7,
  );
}
