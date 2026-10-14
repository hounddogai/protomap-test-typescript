import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingSenderRequest } from "./pending-sender-request.js";

/** One step of the pending sender request calculation. */
export interface PendingSenderRequestModifier {
  describe(): string;
  adjust(item: PendingSenderRequest, value: number): number;
}

export class RoundingPendingSenderRequestAdjuster implements PendingSenderRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingSenderRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPendingSenderRequestAdjuster implements PendingSenderRequestModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingSenderRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPendingSenderRequestAdjuster implements PendingSenderRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingSenderRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPendingSenderRequestAdjuster implements PendingSenderRequestModifier {
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

  adjust(item: PendingSenderRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitlePendingSenderRequestAdjuster implements PendingSenderRequestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingSenderRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending sender request steps in order and keeps a trace of each. */
export class PendingSenderRequestEngine {
  steps: PendingSenderRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingSenderRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingSenderRequest): number {
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

  evaluateAll(items: PendingSenderRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingSenderRequestEngine(flagsValue: flags.Registry): PendingSenderRequestEngine {
  return new PendingSenderRequestEngine(
    [
      new RoundingPendingSenderRequestAdjuster(0.25),
      new MinimumPendingSenderRequestAdjuster(31.4),
      new PercentPendingSenderRequestAdjuster(19.5),
      new FlaggedPendingSenderRequestAdjuster(flagsValue, "pending-sender-request-batched", 1.3),
      new TitlePendingSenderRequestAdjuster(
        new Map<string, number>([["west", 1.06], ["north", 1.05], ["online", 0.75]]),
      ),
    ],
    [],
    2,
    53378.7,
  );
}
