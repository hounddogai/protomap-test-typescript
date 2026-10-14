import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedFunnelAgreement } from "./weighted-funnel-agreement.js";

/** One step of the weighted funnel agreement calculation. */
export interface WeightedFunnelAgreementModifier {
  describe(): string;
  adjust(item: WeightedFunnelAgreement, value: number): number;
}

export class RoundingWeightedFunnelAgreementAdjuster implements WeightedFunnelAgreementModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedFunnelAgreement, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedFunnelAgreementAdjuster implements WeightedFunnelAgreementModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedFunnelAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedFunnelAgreementAdjuster implements WeightedFunnelAgreementModifier {
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

  adjust(item: WeightedFunnelAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class WeightedFunnelAgreementCeilingOffsetAdjuster implements WeightedFunnelAgreementModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: WeightedFunnelAgreement, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the weighted funnel agreement steps in order and keeps a trace of each. */
export class WeightedFunnelAgreementEngine {
  steps: WeightedFunnelAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedFunnelAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedFunnelAgreement): number {
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

  evaluateAll(items: WeightedFunnelAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedFunnelAgreementEngine(flagsValue: flags.Registry): WeightedFunnelAgreementEngine {
  return new WeightedFunnelAgreementEngine(
    [
      new RoundingWeightedFunnelAgreementAdjuster(5),
      new CapWeightedFunnelAgreementAdjuster(34479),
      new FlaggedWeightedFunnelAgreementAdjuster(flagsValue, "weighted-funnel-agreement-capped", 1.1),
      new WeightedFunnelAgreementCeilingOffsetAdjuster(0.17),
    ],
    [],
    4.1,
    33819.7,
  );
}
