import * as numbers from "../../../../kit/numbers.js";
import { InviteForecast } from "./invite-forecast.js";

/** One step of the invite forecast calculation. */
export interface InviteForecastStep {
  describe(): string;
  adjust(item: InviteForecast, value: number): number;
}

export class InviteForecastRateOffsetAdjuster implements InviteForecastStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: InviteForecast, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class CapInviteForecastAdjuster implements InviteForecastStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteForecast, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentInviteForecastAdjuster implements InviteForecastStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteForecast, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the invite forecast steps in order and keeps a trace of each. */
export class InviteForecastEngine {
  steps: InviteForecastStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteForecastStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: InviteForecast): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InviteForecast[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultInviteForecastEngine(): InviteForecastEngine {
  return new InviteForecastEngine(
    [
      new InviteForecastRateOffsetAdjuster(1.53),
      new CapInviteForecastAdjuster(49666),
      new PercentInviteForecastAdjuster(-10.4),
    ],
    [],
    3.7,
    90162.2,
  );
}
