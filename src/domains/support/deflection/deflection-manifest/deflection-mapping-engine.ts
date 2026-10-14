import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DeflectionMapping } from "./deflection-mapping.js";

/** One step of the deflection mapping calculation. */
export interface DeflectionMappingAdjuster {
  describe(): string;
  adjust(item: DeflectionMapping, value: number): number;
}

export class RoundingDeflectionMappingAdjuster implements DeflectionMappingAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DeflectionMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedDeflectionMappingAdjuster implements DeflectionMappingAdjuster {
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

  adjust(item: DeflectionMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TitleDeflectionMappingAdjuster implements DeflectionMappingAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: DeflectionMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDeflectionMappingAdjuster implements DeflectionMappingAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DeflectionMapping, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class DeflectionMappingBudgetOffsetAdjuster implements DeflectionMappingAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: DeflectionMapping, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the deflection mapping steps in order and keeps a trace of each. */
export class DeflectionMappingEngine {
  steps: DeflectionMappingAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DeflectionMappingAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DeflectionMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: DeflectionMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDeflectionMappingEngine(flagsValue: flags.Registry): DeflectionMappingEngine {
  return new DeflectionMappingEngine(
    [
      new RoundingDeflectionMappingAdjuster(5),
      new FlaggedDeflectionMappingAdjuster(flagsValue, "deflection-mapping-capped", -1.2),
      new TitleDeflectionMappingAdjuster(
        new Map<string, number>([["central", 1.12], ["retail", 1.11], ["online", 1.02]]),
      ),
      new PercentDeflectionMappingAdjuster(2.5),
      new DeflectionMappingBudgetOffsetAdjuster(0.23),
    ],
    [],
    3.4,
    70913.9,
  );
}
