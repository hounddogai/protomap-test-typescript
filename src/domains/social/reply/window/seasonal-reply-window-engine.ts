import * as numbers from "../../../../kit/numbers.js";
import { SeasonalReplyWindow } from "./seasonal-reply-window.js";

/** One step of the seasonal reply window calculation. */
export interface SeasonalReplyWindowModifier {
  describe(): string;
  adjust(item: SeasonalReplyWindow, value: number): number;
}

export class RoundingSeasonalReplyWindowAdjuster implements SeasonalReplyWindowModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalReplyWindow, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapSeasonalReplyWindowAdjuster implements SeasonalReplyWindowModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalReplyWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalReplyWindowVersionOffsetAdjuster implements SeasonalReplyWindowModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: SeasonalReplyWindow, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the seasonal reply window steps in order and keeps a trace of each. */
export class SeasonalReplyWindowEngine {
  steps: SeasonalReplyWindowModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalReplyWindowModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: SeasonalReplyWindow): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: SeasonalReplyWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultSeasonalReplyWindowEngine(): SeasonalReplyWindowEngine {
  return new SeasonalReplyWindowEngine(
    [
      new RoundingSeasonalReplyWindowAdjuster(0.5),
      new CapSeasonalReplyWindowAdjuster(31865),
      new SeasonalReplyWindowVersionOffsetAdjuster(1.9),
    ],
    [],
    3.8,
    87191.1,
  );
}
