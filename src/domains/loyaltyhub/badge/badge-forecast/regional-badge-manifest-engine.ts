import { RegionalBadgeManifest } from "./regional-badge-manifest.js";

/** One step of the regional badge manifest calculation. */
export interface RegionalBadgeManifestFactor {
  describe(): string;
  adjust(item: RegionalBadgeManifest, value: number): number;
}

export class LocaleRegionalBadgeManifestAdjuster implements RegionalBadgeManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: RegionalBadgeManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRegionalBadgeManifestAdjuster implements RegionalBadgeManifestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalBadgeManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalBadgeManifestAdjuster implements RegionalBadgeManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalBadgeManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRegionalBadgeManifestAdjuster implements RegionalBadgeManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalBadgeManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional badge manifest steps in order and keeps a trace of each. */
export class RegionalBadgeManifestEngine {
  steps: RegionalBadgeManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBadgeManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalBadgeManifest): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RegionalBadgeManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalBadgeManifestEngine(): RegionalBadgeManifestEngine {
  return new RegionalBadgeManifestEngine(
    [
      new LocaleRegionalBadgeManifestAdjuster(new Map<string, number>([["east", 1.2], ["online", 0.87]])),
      new CapRegionalBadgeManifestAdjuster(26346),
      new MinimumRegionalBadgeManifestAdjuster(4.6),
      new PercentRegionalBadgeManifestAdjuster(9.8),
    ],
    [],
    1.4,
    93405.3,
  );
}
