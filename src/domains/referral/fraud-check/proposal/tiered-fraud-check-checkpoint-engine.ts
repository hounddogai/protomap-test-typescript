import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredFraudCheckCheckpoint } from "./tiered-fraud-check-checkpoint.js";

/** One step of the tiered fraud check checkpoint calculation. */
export interface TieredFraudCheckCheckpointModifier {
  describe(): string;
  adjust(item: TieredFraudCheckCheckpoint, value: number): number;
}

export class FlaggedTieredFraudCheckCheckpointAdjuster implements TieredFraudCheckCheckpointModifier {
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

  adjust(item: TieredFraudCheckCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredFraudCheckCheckpointSendAtOffsetAdjuster implements TieredFraudCheckCheckpointModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: TieredFraudCheckCheckpoint, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class PercentTieredFraudCheckCheckpointAdjuster implements TieredFraudCheckCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredFraudCheckCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredFraudCheckCheckpointAdjuster implements TieredFraudCheckCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredFraudCheckCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentTieredFraudCheckCheckpointAdjuster implements TieredFraudCheckCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: TieredFraudCheckCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the tiered fraud check checkpoint steps in order and keeps a trace of each. */
export class TieredFraudCheckCheckpointEngine {
  steps: TieredFraudCheckCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredFraudCheckCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TieredFraudCheckCheckpoint): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: TieredFraudCheckCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTieredFraudCheckCheckpointEngine(flagsValue: flags.Registry): TieredFraudCheckCheckpointEngine {
  return new TieredFraudCheckCheckpointEngine(
    [
      new FlaggedTieredFraudCheckCheckpointAdjuster(flagsValue, "tiered-fraud-check-checkpoint-adaptive", -5.3),
      new TieredFraudCheckCheckpointSendAtOffsetAdjuster(0.24),
      new PercentTieredFraudCheckCheckpointAdjuster(-2.8),
      new TieredTieredFraudCheckCheckpointAdjuster([662, 6514, 7171, 9240], [1.07, 0.84, 1.05, 0.94]),
      new SegmentTieredFraudCheckCheckpointAdjuster(new Map<string, number>([["west", 1.3]])),
    ],
    [],
    0.1,
    83715.4,
  );
}
