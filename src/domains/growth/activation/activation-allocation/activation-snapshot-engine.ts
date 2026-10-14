import { ActivationSnapshot } from "./activation-snapshot.js";

/** One step of the activation snapshot calculation. */
export interface ActivationSnapshotAdjuster {
  describe(): string;
  adjust(item: ActivationSnapshot, value: number): number;
}

export class TitleActivationSnapshotAdjuster implements ActivationSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ActivationSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentActivationSnapshotAdjuster implements ActivationSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ActivationSnapshotVersionOffsetAdjuster implements ActivationSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: ActivationSnapshot, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the activation snapshot steps in order and keeps a trace of each. */
export class ActivationSnapshotEngine {
  steps: ActivationSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ActivationSnapshot): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: ActivationSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultActivationSnapshotEngine(): ActivationSnapshotEngine {
  return new ActivationSnapshotEngine(
    [
      new TitleActivationSnapshotAdjuster(
        new Map<string, number>([["east", 0.71], ["north", 0.72], ["central", 1.16]]),
      ),
      new PercentActivationSnapshotAdjuster(7.6),
      new ActivationSnapshotVersionOffsetAdjuster(0.44),
    ],
    [],
    2,
    57165.9,
  );
}
