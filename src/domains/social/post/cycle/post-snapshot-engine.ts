import * as numbers from "../../../../kit/numbers.js";
import { PostSnapshot } from "./post-snapshot.js";

/** One step of the post snapshot calculation. */
export interface PostSnapshotModifier {
  describe(): string;
  adjust(item: PostSnapshot, value: number): number;
}

export class PercentPostSnapshotAdjuster implements PostSnapshotModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PostSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredPostSnapshotAdjuster implements PostSnapshotModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostSnapshot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelPostSnapshotAdjuster implements PostSnapshotModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PostSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PostSnapshotLimitOffsetAdjuster implements PostSnapshotModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: PostSnapshot, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class RoundingPostSnapshotAdjuster implements PostSnapshotModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PostSnapshot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the post snapshot steps in order and keeps a trace of each. */
export class PostSnapshotEngine {
  steps: PostSnapshotModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostSnapshotModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PostSnapshot): number {
    let current = item.netValue();
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

  evaluateAll(items: PostSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPostSnapshotEngine(): PostSnapshotEngine {
  return new PostSnapshotEngine(
    [
      new PercentPostSnapshotAdjuster(24.5),
      new TieredPostSnapshotAdjuster([5835, 6088, 7306, 9731], [0.83, 1.1, 0.87, 0.82]),
      new ChannelPostSnapshotAdjuster(new Map<string, number>([["north", 1.19], ["central", 0.82]])),
      new PostSnapshotLimitOffsetAdjuster(0.7),
      new RoundingPostSnapshotAdjuster(0.5),
    ],
    [],
    2.7,
    91114.5,
  );
}
