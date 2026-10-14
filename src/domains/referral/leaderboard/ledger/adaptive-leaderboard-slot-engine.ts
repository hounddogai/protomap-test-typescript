import { AdaptiveLeaderboardSlot } from "./adaptive-leaderboard-slot.js";

/** One step of the adaptive leaderboard slot calculation. */
export interface AdaptiveLeaderboardSlotAdjuster {
  describe(): string;
  adjust(item: AdaptiveLeaderboardSlot, value: number): number;
}

export class TieredAdaptiveLeaderboardSlotAdjuster implements AdaptiveLeaderboardSlotAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveLeaderboardSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumAdaptiveLeaderboardSlotAdjuster implements AdaptiveLeaderboardSlotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveLeaderboardSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveLeaderboardSlotAdjuster implements AdaptiveLeaderboardSlotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveLeaderboardSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelAdaptiveLeaderboardSlotAdjuster implements AdaptiveLeaderboardSlotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: AdaptiveLeaderboardSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the adaptive leaderboard slot steps in order and keeps a trace of each. */
export class AdaptiveLeaderboardSlotEngine {
  steps: AdaptiveLeaderboardSlotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveLeaderboardSlotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveLeaderboardSlot): number {
    let current = item.netTotal();
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

  evaluateAll(items: AdaptiveLeaderboardSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveLeaderboardSlotEngine(): AdaptiveLeaderboardSlotEngine {
  return new AdaptiveLeaderboardSlotEngine(
    [
      new TieredAdaptiveLeaderboardSlotAdjuster([4486, 6514, 8147], [0.93, 1, 0.91]),
      new MinimumAdaptiveLeaderboardSlotAdjuster(11.8),
      new CapAdaptiveLeaderboardSlotAdjuster(32510),
      new ChannelAdaptiveLeaderboardSlotAdjuster(new Map<string, number>([["central", 0.88], ["south", 1.07]])),
    ],
    [],
    2.9,
    78615.1,
  );
}
