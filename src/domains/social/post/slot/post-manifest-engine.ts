import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PostManifest } from "./post-manifest.js";

/** One step of the post manifest calculation. */
export interface PostManifestModifier {
  describe(): string;
  adjust(item: PostManifest, value: number): number;
}

export class PercentPostManifestAdjuster implements PostManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPostManifestAdjuster implements PostManifestModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostManifest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPostManifestAdjuster implements PostManifestModifier {
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

  adjust(item: PostManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelPostManifestAdjuster implements PostManifestModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PostManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPostManifestAdjuster implements PostManifestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the post manifest steps in order and keeps a trace of each. */
export class PostManifestEngine {
  steps: PostManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PostManifest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: PostManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPostManifestEngine(flagsValue: flags.Registry): PostManifestEngine {
  return new PostManifestEngine(
    [
      new PercentPostManifestAdjuster(-22.7),
      new TieredPostManifestAdjuster([4545, 4601, 6411, 6827], [1.12, 0.85, 0.99, 1.15]),
      new FlaggedPostManifestAdjuster(flagsValue, "post-manifest-legacy", 6.8),
      new ChannelPostManifestAdjuster(
        new Map<string, number>([["retail", 1.37], ["north", 1.13], ["south", 0.78]]),
      ),
      new RoundingPostManifestAdjuster(0.5),
    ],
    [],
    1.9,
    62067.3,
  );
}
