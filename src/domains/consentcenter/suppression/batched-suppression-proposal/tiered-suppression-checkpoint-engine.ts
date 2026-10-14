import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

/** One step of the tiered suppression checkpoint calculation. */
export interface TieredSuppressionCheckpointModifier {
  describe(): string;
  adjust(item: TieredSuppressionCheckpoint, value: number): number;
}

export class RoundingTieredSuppressionCheckpointAdjuster implements TieredSuppressionCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredSuppressionCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedTieredSuppressionCheckpointAdjuster implements TieredSuppressionCheckpointModifier {
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

  adjust(item: TieredSuppressionCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ChannelTieredSuppressionCheckpointAdjuster implements TieredSuppressionCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TieredSuppressionCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredTieredSuppressionCheckpointAdjuster implements TieredSuppressionCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredSuppressionCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the tiered suppression checkpoint steps in order and keeps a trace of each. */
export class TieredSuppressionCheckpointEngine {
  steps: TieredSuppressionCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredSuppressionCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredSuppressionCheckpoint): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: TieredSuppressionCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredSuppressionCheckpointEngine(flagsValue: flags.Registry): TieredSuppressionCheckpointEngine {
  return new TieredSuppressionCheckpointEngine(
    [
      new RoundingTieredSuppressionCheckpointAdjuster(5),
      new FlaggedTieredSuppressionCheckpointAdjuster(flagsValue, "tiered-suppression-checkpoint-legacy", 10),
      new ChannelTieredSuppressionCheckpointAdjuster(
        new Map<string, number>([["central", 1.2], ["north", 0.76]]),
      ),
      new TieredTieredSuppressionCheckpointAdjuster([298, 2779, 3857, 8629], [0.94, 1.04, 0.94, 0.93]),
    ],
    [],
    2.6,
    41628.2,
  );
}
