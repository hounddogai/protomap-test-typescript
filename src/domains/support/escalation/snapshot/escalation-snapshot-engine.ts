import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EscalationSnapshot } from "./escalation-snapshot.js";

/** One step of the escalation snapshot calculation. */
export interface EscalationSnapshotModifier {
  describe(): string;
  adjust(item: EscalationSnapshot, value: number): number;
}

export class MinimumEscalationSnapshotAdjuster implements EscalationSnapshotModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EscalationSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class EscalationSnapshotScoreOffsetAdjuster implements EscalationSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: EscalationSnapshot, value: number): number {
    return value + item.score * this.weight;
  }
}

export class RoundingEscalationSnapshotAdjuster implements EscalationSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: EscalationSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentEscalationSnapshotAdjuster implements EscalationSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EscalationSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapEscalationSnapshotAdjuster implements EscalationSnapshotModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EscalationSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedEscalationSnapshotAdjuster implements EscalationSnapshotModifier {
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

  adjust(item: EscalationSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the escalation snapshot steps in order and keeps a trace of each. */
export class EscalationSnapshotEngine {
  steps: EscalationSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EscalationSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EscalationSnapshot): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: EscalationSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEscalationSnapshotEngine(flagsValue: flags.Registry): EscalationSnapshotEngine {
  return new EscalationSnapshotEngine(
    [
      new MinimumEscalationSnapshotAdjuster(17.4),
      new EscalationSnapshotScoreOffsetAdjuster(1.34),
      new RoundingEscalationSnapshotAdjuster(0.25),
      new PercentEscalationSnapshotAdjuster(10.9),
      new CapEscalationSnapshotAdjuster(11250),
      new FlaggedEscalationSnapshotAdjuster(flagsValue, "escalation-snapshot-manual", 6.5),
    ],
    [],
    2.3,
    58220.8,
  );
}
