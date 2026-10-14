import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

/** One step of the fallback exit rule cycle calculation. */
export interface FallbackExitRuleCycleAdjuster {
  describe(): string;
  adjust(item: FallbackExitRuleCycle, value: number): number;
}

export class FallbackExitRuleCycleVersionOffsetAdjuster implements FallbackExitRuleCycleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: FallbackExitRuleCycle, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapFallbackExitRuleCycleAdjuster implements FallbackExitRuleCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackExitRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredFallbackExitRuleCycleAdjuster implements FallbackExitRuleCycleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackExitRuleCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedFallbackExitRuleCycleAdjuster implements FallbackExitRuleCycleAdjuster {
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

  adjust(item: FallbackExitRuleCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackExitRuleCycleAdjuster implements FallbackExitRuleCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackExitRuleCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback exit rule cycle steps in order and keeps a trace of each. */
export class FallbackExitRuleCycleEngine {
  steps: FallbackExitRuleCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackExitRuleCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: FallbackExitRuleCycle): number {
    let current = item.netLoad();
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

  evaluateAll(items: FallbackExitRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultFallbackExitRuleCycleEngine(flagsValue: flags.Registry): FallbackExitRuleCycleEngine {
  return new FallbackExitRuleCycleEngine(
    [
      new FallbackExitRuleCycleVersionOffsetAdjuster(0.64),
      new CapFallbackExitRuleCycleAdjuster(36956),
      new TieredFallbackExitRuleCycleAdjuster([3039, 5462], [1.17, 1.02]),
      new FlaggedFallbackExitRuleCycleAdjuster(flagsValue, "fallback-exit-rule-cycle-capped", 0.4),
      new PercentFallbackExitRuleCycleAdjuster(-11.9),
    ],
    [],
    0.4,
    94614.8,
  );
}
