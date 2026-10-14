import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderSummary } from "./sender-summary.js";

/** One step of the sender summary calculation. */
export interface SenderSummaryModifier {
  describe(): string;
  adjust(item: SenderSummary, value: number): number;
}

export class FlaggedSenderSummaryAdjuster implements SenderSummaryModifier {
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

  adjust(item: SenderSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSenderSummaryAdjuster implements SenderSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SenderSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentSenderSummaryAdjuster implements SenderSummaryModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SenderSummary, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSenderSummaryAdjuster implements SenderSummaryModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderSummary, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameSenderSummaryAdjuster implements SenderSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SenderSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the sender summary steps in order and keeps a trace of each. */
export class SenderSummaryEngine {
  steps: SenderSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SenderSummary): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: SenderSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSenderSummaryEngine(flagsValue: flags.Registry): SenderSummaryEngine {
  return new SenderSummaryEngine(
    [
      new FlaggedSenderSummaryAdjuster(flagsValue, "sender-summary-capped", -8.9),
      new MinimumSenderSummaryAdjuster(33.2),
      new PercentSenderSummaryAdjuster(-11.7),
      new RoundingSenderSummaryAdjuster(0.5),
      new NameSenderSummaryAdjuster(
        new Map<string, number>([["south", 0.7], ["east", 0.79], ["central", 1.14]]),
      ),
    ],
    [],
    3.9,
    36396.5,
  );
}
