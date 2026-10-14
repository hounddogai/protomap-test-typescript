import { DefaultLevelSnapshot } from "./default-level-snapshot.js";

/** One step of the default level snapshot calculation. */
export interface DefaultLevelSnapshotModifier {
  describe(): string;
  adjust(item: DefaultLevelSnapshot, value: number): number;
}

export class MinimumDefaultLevelSnapshotAdjuster implements DefaultLevelSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultLevelSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class DefaultLevelSnapshotGraceDaysOffsetAdjuster implements DefaultLevelSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: DefaultLevelSnapshot, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class PercentDefaultLevelSnapshotAdjuster implements DefaultLevelSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultLevelSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default level snapshot steps in order and keeps a trace of each. */
export class DefaultLevelSnapshotEngine {
  steps: DefaultLevelSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultLevelSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultLevelSnapshot): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: DefaultLevelSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultLevelSnapshotEngine(): DefaultLevelSnapshotEngine {
  return new DefaultLevelSnapshotEngine(
    [
      new MinimumDefaultLevelSnapshotAdjuster(3),
      new DefaultLevelSnapshotGraceDaysOffsetAdjuster(0.42),
      new PercentDefaultLevelSnapshotAdjuster(-2.4),
    ],
    [],
    2.9,
    91400.1,
  );
}
