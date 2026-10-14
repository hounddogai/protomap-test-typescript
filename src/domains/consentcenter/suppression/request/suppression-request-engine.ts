import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SuppressionRequest } from "./suppression-request.js";

/** One step of the suppression request calculation. */
export interface SuppressionRequestAdjuster {
  describe(): string;
  adjust(item: SuppressionRequest, value: number): number;
}

export class RoundingSuppressionRequestAdjuster implements SuppressionRequestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SuppressionRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSuppressionRequestAdjuster implements SuppressionRequestAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SuppressionRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSuppressionRequestAdjuster implements SuppressionRequestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SuppressionRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredSuppressionRequestAdjuster implements SuppressionRequestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SuppressionRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedSuppressionRequestAdjuster implements SuppressionRequestAdjuster {
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

  adjust(item: SuppressionRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the suppression request steps in order and keeps a trace of each. */
export class SuppressionRequestEngine {
  steps: SuppressionRequestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SuppressionRequestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SuppressionRequest): number {
    let current = item.netLoad();
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

  evaluateAll(items: SuppressionRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSuppressionRequestEngine(flagsValue: flags.Registry): SuppressionRequestEngine {
  return new SuppressionRequestEngine(
    [
      new RoundingSuppressionRequestAdjuster(0.5),
      new CapSuppressionRequestAdjuster(15159),
      new PercentSuppressionRequestAdjuster(-24.1),
      new TieredSuppressionRequestAdjuster([27, 1534, 7827, 9243], [0.92, 1.11, 0.83, 0.91]),
      new FlaggedSuppressionRequestAdjuster(flagsValue, "suppression-request-lenient", 2.2),
    ],
    [],
    1.6,
    65797.2,
  );
}
