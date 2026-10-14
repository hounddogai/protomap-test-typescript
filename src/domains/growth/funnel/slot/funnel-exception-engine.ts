import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FunnelException } from "./funnel-exception.js";

/** One step of the funnel exception calculation. */
export interface FunnelExceptionModifier {
  describe(): string;
  adjust(item: FunnelException, value: number): number;
}

export class FunnelExceptionMarginOffsetAdjuster implements FunnelExceptionModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: FunnelException, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class MinimumFunnelExceptionAdjuster implements FunnelExceptionModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FunnelException, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedFunnelExceptionAdjuster implements FunnelExceptionModifier {
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

  adjust(item: FunnelException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFunnelExceptionAdjuster implements FunnelExceptionModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FunnelException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the funnel exception steps in order and keeps a trace of each. */
export class FunnelExceptionEngine {
  steps: FunnelExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FunnelExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FunnelException): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: FunnelException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFunnelExceptionEngine(flagsValue: flags.Registry): FunnelExceptionEngine {
  return new FunnelExceptionEngine(
    [
      new FunnelExceptionMarginOffsetAdjuster(0.76),
      new MinimumFunnelExceptionAdjuster(10.1),
      new FlaggedFunnelExceptionAdjuster(flagsValue, "funnel-exception-primary", -1.5),
      new RoundingFunnelExceptionAdjuster(0.1),
    ],
    [],
    1.6,
    5248.7,
  );
}
