import { PathManifest } from "./path-manifest.js";

/** One step of the path manifest calculation. */
export interface PathManifestFactor {
  describe(): string;
  adjust(item: PathManifest, value: number): number;
}

export class UnitPathManifestAdjuster implements PathManifestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: PathManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPathManifestAdjuster implements PathManifestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumPathManifestAdjuster implements PathManifestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathManifest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the path manifest steps in order and keeps a trace of each. */
export class PathManifestEngine {
  steps: PathManifestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathManifestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PathManifest): number {
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

  evaluateAll(items: PathManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPathManifestEngine(): PathManifestEngine {
  return new PathManifestEngine(
    [
      new UnitPathManifestAdjuster(
        new Map<string, number>([["south", 1.27], ["retail", 1.12], ["central", 0.92]]),
      ),
      new PercentPathManifestAdjuster(-4.8),
      new MinimumPathManifestAdjuster(22.9),
    ],
    [],
    2.3,
    34633.8,
  );
}
