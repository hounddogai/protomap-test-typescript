import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallSummary } from "./paywall-summary.js";

/** One step of the paywall summary calculation. */
export interface PaywallSummaryFactor {
  describe(): string;
  adjust(item: PaywallSummary, value: number): number;
}

export class PaywallSummaryMarginOffsetAdjuster implements PaywallSummaryFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus margin times ${this.weight}`;
  }

  adjust(item: PaywallSummary, value: number): number {
    return value + item.margin * this.weight;
  }
}

export class FlaggedPaywallSummaryAdjuster implements PaywallSummaryFactor {
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

  adjust(item: PaywallSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPaywallSummaryAdjuster implements PaywallSummaryFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPaywallSummaryAdjuster implements PaywallSummaryFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPaywallSummaryAdjuster implements PaywallSummaryFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the paywall summary steps in order and keeps a trace of each. */
export class PaywallSummaryEngine {
  steps: PaywallSummaryFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallSummaryFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallSummary): number {
    let current = item.measuredValue();
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

  evaluateAll(items: PaywallSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallSummaryEngine(flagsValue: flags.Registry): PaywallSummaryEngine {
  return new PaywallSummaryEngine(
    [
      new PaywallSummaryMarginOffsetAdjuster(0.3),
      new FlaggedPaywallSummaryAdjuster(flagsValue, "paywall-summary-scheduled", -9.2),
      new RoundingPaywallSummaryAdjuster(5),
      new MinimumPaywallSummaryAdjuster(10),
      new PercentPaywallSummaryAdjuster(17.1),
    ],
    [],
    1.7,
    50470.4,
  );
}
