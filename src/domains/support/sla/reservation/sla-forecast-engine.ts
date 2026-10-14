import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaForecast } from "./sla-forecast.js";

/** One step of the sla forecast calculation. */
export interface SlaForecastModifier {
  describe(): string;
  adjust(item: SlaForecast, value: number): number;
}

export class RoundingSlaForecastAdjuster implements SlaForecastModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaForecast, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumSlaForecastAdjuster implements SlaForecastModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaForecast, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedSlaForecastAdjuster implements SlaForecastModifier {
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

  adjust(item: SlaForecast, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelSlaForecastAdjuster implements SlaForecastModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: SlaForecast, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSlaForecastAdjuster implements SlaForecastModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SlaForecastVersionOffsetAdjuster implements SlaForecastModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SlaForecast, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the sla forecast steps in order and keeps a trace of each. */
export class SlaForecastEngine {
  steps: SlaForecastModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaForecastModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaForecast): number {
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

  evaluateAll(items: SlaForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaForecastEngine(flagsValue: flags.Registry): SlaForecastEngine {
  return new SlaForecastEngine(
    [
      new RoundingSlaForecastAdjuster(0.1),
      new MinimumSlaForecastAdjuster(7.3),
      new FlaggedSlaForecastAdjuster(flagsValue, "sla-forecast-scheduled", 6.5),
      new ChannelSlaForecastAdjuster(new Map<string, number>([["central", 1.13], ["north", 1.28]])),
      new CapSlaForecastAdjuster(27940),
      new SlaForecastVersionOffsetAdjuster(1.03),
    ],
    [],
    4.3,
    64547.5,
  );
}
