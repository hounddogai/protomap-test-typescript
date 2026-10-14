import * as numbers from "../../../../kit/numbers.js";
import { ActivationScore } from "./activation-score.js";

/** One step of the activation score calculation. */
export interface ActivationScoreModifier {
  describe(): string;
  adjust(item: ActivationScore, value: number): number;
}

export class ActivationScoreClicksOffsetAdjuster implements ActivationScoreModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: ActivationScore, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class PercentActivationScoreAdjuster implements ActivationScoreModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ActivationScore, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingActivationScoreAdjuster implements ActivationScoreModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ActivationScore, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the activation score steps in order and keeps a trace of each. */
export class ActivationScoreEngine {
  steps: ActivationScoreModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ActivationScoreModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ActivationScore): number {
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

  evaluateAll(items: ActivationScore[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultActivationScoreEngine(): ActivationScoreEngine {
  return new ActivationScoreEngine(
    [
      new ActivationScoreClicksOffsetAdjuster(0.88),
      new PercentActivationScoreAdjuster(21),
      new RoundingActivationScoreAdjuster(5),
    ],
    [],
    4.1,
    4605.1,
  );
}
