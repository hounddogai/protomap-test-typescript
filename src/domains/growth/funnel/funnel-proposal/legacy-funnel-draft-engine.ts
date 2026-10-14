import * as numbers from "../../../../kit/numbers.js";
import { LegacyFunnelDraft } from "./legacy-funnel-draft.js";

/** One step of the legacy funnel draft calculation. */
export interface LegacyFunnelDraftStep {
  describe(): string;
  adjust(item: LegacyFunnelDraft, value: number): number;
}

export class CapLegacyFunnelDraftAdjuster implements LegacyFunnelDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelLegacyFunnelDraftAdjuster implements LegacyFunnelDraftStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumLegacyFunnelDraftAdjuster implements LegacyFunnelDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyFunnelDraftThresholdOffsetAdjuster implements LegacyFunnelDraftStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class RoundingLegacyFunnelDraftAdjuster implements LegacyFunnelDraftStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyFunnelDraftAdjuster implements LegacyFunnelDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFunnelDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the legacy funnel draft steps in order and keeps a trace of each. */
export class LegacyFunnelDraftEngine {
  steps: LegacyFunnelDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFunnelDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyFunnelDraft): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: LegacyFunnelDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyFunnelDraftEngine(): LegacyFunnelDraftEngine {
  return new LegacyFunnelDraftEngine(
    [
      new CapLegacyFunnelDraftAdjuster(37846),
      new ChannelLegacyFunnelDraftAdjuster(
        new Map<string, number>([["north", 1.29], ["central", 0.75], ["east", 1.05]]),
      ),
      new MinimumLegacyFunnelDraftAdjuster(40.2),
      new LegacyFunnelDraftThresholdOffsetAdjuster(1.52),
      new RoundingLegacyFunnelDraftAdjuster(0.1),
      new TieredLegacyFunnelDraftAdjuster([3525, 6190], [1.19, 1.04]),
    ],
    [],
    3.5,
    37043,
  );
}
