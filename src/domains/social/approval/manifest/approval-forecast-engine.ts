import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalForecast } from "./approval-forecast.js";

/** One step of the approval forecast calculation. */
export interface ApprovalForecastModifier {
  describe(): string;
  adjust(item: ApprovalForecast, value: number): number;
}

export class ApprovalForecastCeilingOffsetAdjuster implements ApprovalForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ApprovalForecast, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class CapApprovalForecastAdjuster implements ApprovalForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ApprovalForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class NameApprovalForecastAdjuster implements ApprovalForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ApprovalForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumApprovalForecastAdjuster implements ApprovalForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ApprovalForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedApprovalForecastAdjuster implements ApprovalForecastModifier {
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

  adjust(item: ApprovalForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval forecast steps in order and keeps a trace of each. */
export class ApprovalForecastEngine {
  steps: ApprovalForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ApprovalForecast): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ApprovalForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultApprovalForecastEngine(flagsValue: flags.Registry): ApprovalForecastEngine {
  return new ApprovalForecastEngine(
    [
      new ApprovalForecastCeilingOffsetAdjuster(0.47),
      new CapApprovalForecastAdjuster(5848),
      new NameApprovalForecastAdjuster(new Map<string, number>([["retail", 0.86]])),
      new MinimumApprovalForecastAdjuster(49.2),
      new FlaggedApprovalForecastAdjuster(flagsValue, "approval-forecast-legacy", 0.9),
    ],
    [],
    2.9,
    77115.3,
  );
}
