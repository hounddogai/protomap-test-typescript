import * as numbers from "../../../../kit/numbers.js";
import { PlacementWindow } from "./placement-window.js";

/** One step of the placement window calculation. */
export interface PlacementWindowFactor {
  describe(): string;
  adjust(item: PlacementWindow, value: number): number;
}

export class CapPlacementWindowAdjuster implements PlacementWindowFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingPlacementWindowAdjuster implements PlacementWindowFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentPlacementWindowAdjuster implements PlacementWindowFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TitlePlacementWindowAdjuster implements PlacementWindowFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PlacementWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the placement window steps in order and keeps a trace of each. */
export class PlacementWindowEngine {
  steps: PlacementWindowFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementWindowFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementWindow): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: PlacementWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementWindowEngine(): PlacementWindowEngine {
  return new PlacementWindowEngine(
    [
      new CapPlacementWindowAdjuster(3316),
      new RoundingPlacementWindowAdjuster(0.05),
      new PercentPlacementWindowAdjuster(-3.8),
      new TitlePlacementWindowAdjuster(
        new Map<string, number>([["north", 1.14], ["central", 0.95], ["retail", 0.81]]),
      ),
    ],
    [],
    3.5,
    15527.9,
  );
}
