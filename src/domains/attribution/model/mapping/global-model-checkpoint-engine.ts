import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalModelCheckpoint } from "./global-model-checkpoint.js";

/** One step of the global model checkpoint calculation. */
export interface GlobalModelCheckpointModifier {
  describe(): string;
  adjust(item: GlobalModelCheckpoint, value: number): number;
}

export class FlaggedGlobalModelCheckpointAdjuster implements GlobalModelCheckpointModifier {
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

  adjust(item: GlobalModelCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalModelCheckpointAdjuster implements GlobalModelCheckpointModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalModelCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class NameGlobalModelCheckpointAdjuster implements GlobalModelCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: GlobalModelCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingGlobalModelCheckpointAdjuster implements GlobalModelCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalModelCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentGlobalModelCheckpointAdjuster implements GlobalModelCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalModelCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the global model checkpoint steps in order and keeps a trace of each. */
export class GlobalModelCheckpointEngine {
  steps: GlobalModelCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalModelCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalModelCheckpoint): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: GlobalModelCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalModelCheckpointEngine(flagsValue: flags.Registry): GlobalModelCheckpointEngine {
  return new GlobalModelCheckpointEngine(
    [
      new FlaggedGlobalModelCheckpointAdjuster(flagsValue, "global-model-checkpoint-fallback", 7.5),
      new TieredGlobalModelCheckpointAdjuster([5015, 5297, 7122], [0.98, 0.84, 0.92]),
      new NameGlobalModelCheckpointAdjuster(new Map<string, number>([["north", 1.06], ["east", 0.91]])),
      new RoundingGlobalModelCheckpointAdjuster(5),
      new PercentGlobalModelCheckpointAdjuster(22.9),
    ],
    [],
    3.1,
    9682.5,
  );
}
