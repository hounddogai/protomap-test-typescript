import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingBidRuleManifest } from "./pending-bid-rule-manifest.js";

/** One step of the pending bid rule manifest calculation. */
export interface PendingBidRuleManifestModifier {
  describe(): string;
  adjust(item: PendingBidRuleManifest, value: number): number;
}

export class FlaggedPendingBidRuleManifestAdjuster implements PendingBidRuleManifestModifier {
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

  adjust(item: PendingBidRuleManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingBidRuleManifestAdjuster implements PendingBidRuleManifestModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingBidRuleManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitlePendingBidRuleManifestAdjuster implements PendingBidRuleManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PendingBidRuleManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PendingBidRuleManifestCeilingOffsetAdjuster implements PendingBidRuleManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: PendingBidRuleManifest, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class RoundingPendingBidRuleManifestAdjuster implements PendingBidRuleManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingBidRuleManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the pending bid rule manifest steps in order and keeps a trace of each. */
export class PendingBidRuleManifestEngine {
  steps: PendingBidRuleManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingBidRuleManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingBidRuleManifest): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: PendingBidRuleManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingBidRuleManifestEngine(flagsValue: flags.Registry): PendingBidRuleManifestEngine {
  return new PendingBidRuleManifestEngine(
    [
      new FlaggedPendingBidRuleManifestAdjuster(flagsValue, "pending-bid-rule-manifest-lenient", -6.5),
      new CapPendingBidRuleManifestAdjuster(27769),
      new TitlePendingBidRuleManifestAdjuster(
        new Map<string, number>([["south", 1.07], ["west", 1], ["east", 0.94]]),
      ),
      new PendingBidRuleManifestCeilingOffsetAdjuster(0.29),
      new RoundingPendingBidRuleManifestAdjuster(5),
    ],
    [],
    0.9,
    42583,
  );
}
