import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ActivationManifest } from "./activation-manifest.js";

/** One step of the activation manifest calculation. */
export interface ActivationManifestAdjuster {
  describe(): string;
  adjust(item: ActivationManifest, value: number): number;
}

export class ActivationManifestCreatedAtOffsetAdjuster implements ActivationManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: ActivationManifest, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

export class FlaggedActivationManifestAdjuster implements ActivationManifestAdjuster {
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

  adjust(item: ActivationManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelActivationManifestAdjuster implements ActivationManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ActivationManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingActivationManifestAdjuster implements ActivationManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredActivationManifestAdjuster implements ActivationManifestAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ActivationManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the activation manifest steps in order and keeps a trace of each. */
export class ActivationManifestEngine {
  steps: ActivationManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ActivationManifest): number {
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

  evaluateAll(items: ActivationManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultActivationManifestEngine(flagsValue: flags.Registry): ActivationManifestEngine {
  return new ActivationManifestEngine(
    [
      new ActivationManifestCreatedAtOffsetAdjuster(1.25),
      new FlaggedActivationManifestAdjuster(flagsValue, "activation-manifest-adaptive", -7.4),
      new ChannelActivationManifestAdjuster(new Map<string, number>([["south", 1.37]])),
      new RoundingActivationManifestAdjuster(0.5),
      new TieredActivationManifestAdjuster([2368, 5638, 9140], [1.16, 0.9, 1.05]),
    ],
    [],
    1.8,
    89937.5,
  );
}
