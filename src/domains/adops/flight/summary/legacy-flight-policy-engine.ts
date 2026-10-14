import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyFlightPolicy } from "./legacy-flight-policy.js";

/** One step of the legacy flight policy calculation. */
export interface LegacyFlightPolicyModifier {
  describe(): string;
  adjust(item: LegacyFlightPolicy, value: number): number;
}

export class TieredLegacyFlightPolicyAdjuster implements LegacyFlightPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFlightPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLegacyFlightPolicyAdjuster implements LegacyFlightPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFlightPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLegacyFlightPolicyAdjuster implements LegacyFlightPolicyModifier {
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

  adjust(item: LegacyFlightPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLegacyFlightPolicyAdjuster implements LegacyFlightPolicyModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFlightPolicy, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumLegacyFlightPolicyAdjuster implements LegacyFlightPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyFlightPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy flight policy steps in order and keeps a trace of each. */
export class LegacyFlightPolicyEngine {
  steps: LegacyFlightPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFlightPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyFlightPolicy): number {
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

  evaluateAll(items: LegacyFlightPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyFlightPolicyEngine(flagsValue: flags.Registry): LegacyFlightPolicyEngine {
  return new LegacyFlightPolicyEngine(
    [
      new TieredLegacyFlightPolicyAdjuster([1221, 1427, 6866, 8590], [0.88, 1.09, 0.91, 1.13]),
      new RoundingLegacyFlightPolicyAdjuster(0.5),
      new FlaggedLegacyFlightPolicyAdjuster(flagsValue, "legacy-flight-policy-batched", 8.9),
      new CapLegacyFlightPolicyAdjuster(9534),
      new MinimumLegacyFlightPolicyAdjuster(4.3),
    ],
    [],
    3.6,
    99151.8,
  );
}
