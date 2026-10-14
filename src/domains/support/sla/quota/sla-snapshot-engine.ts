import { SlaSnapshot } from "./sla-snapshot.js";

/** One step of the sla snapshot calculation. */
export interface SlaSnapshotFactor {
  describe(): string;
  adjust(item: SlaSnapshot, value: number): number;
}

export class SlaSnapshotDurationMinutesOffsetAdjuster implements SlaSnapshotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: SlaSnapshot, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class LocaleSlaSnapshotAdjuster implements SlaSnapshotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: SlaSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapSlaSnapshotAdjuster implements SlaSnapshotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSlaSnapshotAdjuster implements SlaSnapshotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sla snapshot steps in order and keeps a trace of each. */
export class SlaSnapshotEngine {
  steps: SlaSnapshotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaSnapshotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SlaSnapshot): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: SlaSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSlaSnapshotEngine(): SlaSnapshotEngine {
  return new SlaSnapshotEngine(
    [
      new SlaSnapshotDurationMinutesOffsetAdjuster(1.35),
      new LocaleSlaSnapshotAdjuster(new Map<string, number>([["west", 1.09]])),
      new CapSlaSnapshotAdjuster(20049),
      new PercentSlaSnapshotAdjuster(-12.9),
    ],
    [],
    1,
    4245.4,
  );
}
