import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalQueueProfile } from "./global-queue-profile.js";

/** One step of the global queue profile calculation. */
export interface GlobalQueueProfileModifier {
  describe(): string;
  adjust(item: GlobalQueueProfile, value: number): number;
}

export class GlobalQueueProfileRevisionOffsetAdjuster implements GlobalQueueProfileModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus revision times ${this.weight}`;
  }

  adjust(item: GlobalQueueProfile, value: number): number {
    return value + item.revision * this.weight;
  }
}

export class FlaggedGlobalQueueProfileAdjuster implements GlobalQueueProfileModifier {
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

  adjust(item: GlobalQueueProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UnitGlobalQueueProfileAdjuster implements GlobalQueueProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: GlobalQueueProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the global queue profile steps in order and keeps a trace of each. */
export class GlobalQueueProfileEngine {
  steps: GlobalQueueProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalQueueProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: GlobalQueueProfile): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: GlobalQueueProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultGlobalQueueProfileEngine(flagsValue: flags.Registry): GlobalQueueProfileEngine {
  return new GlobalQueueProfileEngine(
    [
      new GlobalQueueProfileRevisionOffsetAdjuster(1.34),
      new FlaggedGlobalQueueProfileAdjuster(flagsValue, "global-queue-profile-regional", -1),
      new UnitGlobalQueueProfileAdjuster(
        new Map<string, number>([["north", 0.75], ["central", 0.73], ["south", 1.15]]),
      ),
    ],
    [],
    4.3,
    78462.5,
  );
}
