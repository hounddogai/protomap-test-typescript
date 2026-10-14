import * as flags from "../../../../kit/flags.js";
import { LegacyPacingAgreement } from "./legacy-pacing-agreement.js";

/** One step of the legacy pacing agreement calculation. */
export interface LegacyPacingAgreementModifier {
  describe(): string;
  adjust(item: LegacyPacingAgreement, value: number): number;
}

export class FlaggedLegacyPacingAgreementAdjuster implements LegacyPacingAgreementModifier {
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

  adjust(item: LegacyPacingAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyPacingAgreementAdjuster implements LegacyPacingAgreementModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPacingAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SegmentLegacyPacingAgreementAdjuster implements LegacyPacingAgreementModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: LegacyPacingAgreement, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLegacyPacingAgreementAdjuster implements LegacyPacingAgreementModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPacingAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy pacing agreement steps in order and keeps a trace of each. */
export class LegacyPacingAgreementEngine {
  steps: LegacyPacingAgreementModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPacingAgreementModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyPacingAgreement): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LegacyPacingAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyPacingAgreementEngine(flagsValue: flags.Registry): LegacyPacingAgreementEngine {
  return new LegacyPacingAgreementEngine(
    [
      new FlaggedLegacyPacingAgreementAdjuster(flagsValue, "legacy-pacing-agreement-lenient", -7.1),
      new MinimumLegacyPacingAgreementAdjuster(3.3),
      new SegmentLegacyPacingAgreementAdjuster(
        new Map<string, number>([["online", 0.96], ["south", 1.33], ["north", 1.14]]),
      ),
      new TieredLegacyPacingAgreementAdjuster([2307, 7254], [1.04, 1.02]),
    ],
    [],
    3.7,
    95386.3,
  );
}
