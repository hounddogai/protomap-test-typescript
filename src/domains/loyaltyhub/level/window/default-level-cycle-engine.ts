import * as numbers from "../../../../kit/numbers.js";
import { DefaultLevelCycle } from "./default-level-cycle.js";

/** One step of the default level cycle calculation. */
export interface DefaultLevelCycleFactor {
  describe(): string;
  adjust(item: DefaultLevelCycle, value: number): number;
}

export class RoundingDefaultLevelCycleAdjuster implements DefaultLevelCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultLevelCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NameDefaultLevelCycleAdjuster implements DefaultLevelCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: DefaultLevelCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class DefaultLevelCycleRatioOffsetAdjuster implements DefaultLevelCycleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: DefaultLevelCycle, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class PercentDefaultLevelCycleAdjuster implements DefaultLevelCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultLevelCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDefaultLevelCycleAdjuster implements DefaultLevelCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultLevelCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the default level cycle steps in order and keeps a trace of each. */
export class DefaultLevelCycleEngine {
  steps: DefaultLevelCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultLevelCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultLevelCycle): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: DefaultLevelCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultLevelCycleEngine(): DefaultLevelCycleEngine {
  return new DefaultLevelCycleEngine(
    [
      new RoundingDefaultLevelCycleAdjuster(1),
      new NameDefaultLevelCycleAdjuster(new Map<string, number>([["west", 0.71]])),
      new DefaultLevelCycleRatioOffsetAdjuster(0.27),
      new PercentDefaultLevelCycleAdjuster(-11.3),
      new CapDefaultLevelCycleAdjuster(4772),
    ],
    [],
    0.4,
    27125.5,
  );
}
