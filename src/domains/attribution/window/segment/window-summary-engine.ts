import * as numbers from "../../../../kit/numbers.js";
import { WindowSummary } from "./window-summary.js";

/** One step of the window summary calculation. */
export interface WindowSummaryModifier {
  describe(): string;
  adjust(item: WindowSummary, value: number): number;
}

export class TieredWindowSummaryAdjuster implements WindowSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WindowSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelWindowSummaryAdjuster implements WindowSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: WindowSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingWindowSummaryAdjuster implements WindowSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WindowSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentWindowSummaryAdjuster implements WindowSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWindowSummaryAdjuster implements WindowSummaryModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WindowSummary, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the window summary steps in order and keeps a trace of each. */
export class WindowSummaryEngine {
  steps: WindowSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WindowSummary): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: WindowSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWindowSummaryEngine(): WindowSummaryEngine {
  return new WindowSummaryEngine(
    [
      new TieredWindowSummaryAdjuster([1919, 5052, 5191, 5655], [0.89, 0.92, 0.84, 0.96]),
      new ChannelWindowSummaryAdjuster(new Map<string, number>([["retail", 0.87], ["east", 1.18]])),
      new RoundingWindowSummaryAdjuster(5),
      new PercentWindowSummaryAdjuster(-5.2),
      new CapWindowSummaryAdjuster(33549),
    ],
    [],
    3.7,
    78117.7,
  );
}
