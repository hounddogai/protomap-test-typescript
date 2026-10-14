import * as numbers from "../../../../kit/numbers.js";
import { RegionalCreativeScore } from "./regional-creative-score.js";

/** One step of the regional creative score calculation. */
export interface RegionalCreativeScoreAdjuster {
  describe(): string;
  adjust(item: RegionalCreativeScore, value: number): number;
}

export class PercentRegionalCreativeScoreAdjuster implements RegionalCreativeScoreAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalCreativeScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalCreativeScoreAdjuster implements RegionalCreativeScoreAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalCreativeScore, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RegionalCreativeScoreWindowDaysOffsetAdjuster implements RegionalCreativeScoreAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: RegionalCreativeScore, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

/** Runs the regional creative score steps in order and keeps a trace of each. */
export class RegionalCreativeScoreEngine {
  steps: RegionalCreativeScoreAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalCreativeScoreAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalCreativeScore): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: RegionalCreativeScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalCreativeScoreEngine(): RegionalCreativeScoreEngine {
  return new RegionalCreativeScoreEngine(
    [
      new PercentRegionalCreativeScoreAdjuster(-15),
      new CapRegionalCreativeScoreAdjuster(11154),
      new RegionalCreativeScoreWindowDaysOffsetAdjuster(0.15),
    ],
    [],
    0.3,
    66227.3,
  );
}
