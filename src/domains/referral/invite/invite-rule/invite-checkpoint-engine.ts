import * as numbers from "../../../../kit/numbers.js";
import { InviteCheckpoint } from "./invite-checkpoint.js";

/** One step of the invite checkpoint calculation. */
export interface InviteCheckpointAdjuster {
  describe(): string;
  adjust(item: InviteCheckpoint, value: number): number;
}

export class InviteCheckpointFrequencyCapOffsetAdjuster implements InviteCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class CapInviteCheckpointAdjuster implements InviteCheckpointAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingInviteCheckpointAdjuster implements InviteCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumInviteCheckpointAdjuster implements InviteCheckpointAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredInviteCheckpointAdjuster implements InviteCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentInviteCheckpointAdjuster implements InviteCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: InviteCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the invite checkpoint steps in order and keeps a trace of each. */
export class InviteCheckpointEngine {
  steps: InviteCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InviteCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: InviteCheckpoint): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: InviteCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultInviteCheckpointEngine(): InviteCheckpointEngine {
  return new InviteCheckpointEngine(
    [
      new InviteCheckpointFrequencyCapOffsetAdjuster(1.81),
      new CapInviteCheckpointAdjuster(16935),
      new RoundingInviteCheckpointAdjuster(0.05),
      new MinimumInviteCheckpointAdjuster(42),
      new TieredInviteCheckpointAdjuster([8379, 9509], [0.84, 0.92]),
      new PercentInviteCheckpointAdjuster(13.7),
    ],
    [],
    2.2,
    21865.7,
  );
}
