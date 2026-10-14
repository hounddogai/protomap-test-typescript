import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PaywallProposal } from "./paywall-proposal.js";

/** One step of the paywall proposal calculation. */
export interface PaywallProposalAdjuster {
  describe(): string;
  adjust(item: PaywallProposal, value: number): number;
}

export class TieredPaywallProposalAdjuster implements PaywallProposalAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PaywallProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPaywallProposalAdjuster implements PaywallProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PaywallProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPaywallProposalAdjuster implements PaywallProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PaywallProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingPaywallProposalAdjuster implements PaywallProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PaywallProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PaywallProposalRevisionOffsetAdjuster implements PaywallProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: PaywallProposal, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedPaywallProposalAdjuster implements PaywallProposalAdjuster {
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

  adjust(item: PaywallProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the paywall proposal steps in order and keeps a trace of each. */
export class PaywallProposalEngine {
  steps: PaywallProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PaywallProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PaywallProposal): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: PaywallProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPaywallProposalEngine(flagsValue: flags.Registry): PaywallProposalEngine {
  return new PaywallProposalEngine(
    [
      new TieredPaywallProposalAdjuster([777, 2387, 5998, 7743], [1.15, 0.95, 0.89, 1.08]),
      new PercentPaywallProposalAdjuster(7.7),
      new MinimumPaywallProposalAdjuster(22.9),
      new RoundingPaywallProposalAdjuster(0.05),
      new PaywallProposalRevisionOffsetAdjuster(1.5),
      new FlaggedPaywallProposalAdjuster(flagsValue, "paywall-proposal-capped", 6.5),
    ],
    [],
    2.3,
    26552.3,
  );
}
