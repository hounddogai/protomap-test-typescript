import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

/** One step of the default exit rule forecast calculation. */
export interface DefaultExitRuleForecastStep {
  describe(): string;
  adjust(item: DefaultExitRuleForecast, value: number): number;
}

export class FlaggedDefaultExitRuleForecastAdjuster implements DefaultExitRuleForecastStep {
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

  adjust(item: DefaultExitRuleForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultExitRuleForecastAdjuster implements DefaultExitRuleForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultExitRuleForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentDefaultExitRuleForecastAdjuster implements DefaultExitRuleForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultExitRuleForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDefaultExitRuleForecastAdjuster implements DefaultExitRuleForecastStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultExitRuleForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the default exit rule forecast steps in order and keeps a trace of each. */
export class DefaultExitRuleForecastEngine {
  steps: DefaultExitRuleForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultExitRuleForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultExitRuleForecast): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DefaultExitRuleForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultExitRuleForecastEngine(flagsValue: flags.Registry): DefaultExitRuleForecastEngine {
  return new DefaultExitRuleForecastEngine(
    [
      new FlaggedDefaultExitRuleForecastAdjuster(flagsValue, "default-exit-rule-forecast-pending", -4.9),
      new CapDefaultExitRuleForecastAdjuster(6113),
      new PercentDefaultExitRuleForecastAdjuster(17.5),
      new RoundingDefaultExitRuleForecastAdjuster(1),
    ],
    [],
    1,
    57987.1,
  );
}
