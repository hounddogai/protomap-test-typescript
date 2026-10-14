import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyAgreement } from "./journey-agreement.js";

/** One step of the journey agreement calculation. */
export interface JourneyAgreementFactor {
  describe(): string;
  adjust(item: JourneyAgreement, value: number): number;
}

export class FlaggedJourneyAgreementAdjuster implements JourneyAgreementFactor {
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

  adjust(item: JourneyAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingJourneyAgreementAdjuster implements JourneyAgreementFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredJourneyAgreementAdjuster implements JourneyAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: JourneyAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumJourneyAgreementAdjuster implements JourneyAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the journey agreement steps in order and keeps a trace of each. */
export class JourneyAgreementEngine {
  steps: JourneyAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyAgreement): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: JourneyAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyAgreementEngine(flagsValue: flags.Registry): JourneyAgreementEngine {
  return new JourneyAgreementEngine(
    [
      new FlaggedJourneyAgreementAdjuster(flagsValue, "journey-agreement-default", -2),
      new RoundingJourneyAgreementAdjuster(0.5),
      new TieredJourneyAgreementAdjuster([1077, 2870, 8881], [1.19, 1.11, 1]),
      new MinimumJourneyAgreementAdjuster(27.5),
    ],
    [],
    2.6,
    77997.2,
  );
}
