import * as numbers from "../../../../kit/numbers.js";
import { DomainSnapshot } from "./domain-snapshot.js";

/** One step of the domain snapshot calculation. */
export interface DomainSnapshotFactor {
  describe(): string;
  adjust(item: DomainSnapshot, value: number): number;
}

export class DomainSnapshotBudgetOffsetAdjuster implements DomainSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: DomainSnapshot, value: number): number {
    return value + item.budget * this.weight;
  }
}

export class PercentDomainSnapshotAdjuster implements DomainSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DomainSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingDomainSnapshotAdjuster implements DomainSnapshotFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DomainSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the domain snapshot steps in order and keeps a trace of each. */
export class DomainSnapshotEngine {
  steps: DomainSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DomainSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DomainSnapshot): number {
    let current = item.measuredValue();
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

  evaluateAll(items: DomainSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDomainSnapshotEngine(): DomainSnapshotEngine {
  return new DomainSnapshotEngine(
    [
      new DomainSnapshotBudgetOffsetAdjuster(0.08),
      new PercentDomainSnapshotAdjuster(8.4),
      new RoundingDomainSnapshotAdjuster(0.5),
    ],
    [],
    4.3,
    88295.6,
  );
}
