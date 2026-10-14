import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelTemplate } from "./level-template.js";

/** One step of the level template calculation. */
export interface LevelTemplateModifier {
  describe(): string;
  adjust(item: LevelTemplate, value: number): number;
}

export class RoundingLevelTemplateAdjuster implements LevelTemplateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelTemplate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumLevelTemplateAdjuster implements LevelTemplateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredLevelTemplateAdjuster implements LevelTemplateModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedLevelTemplateAdjuster implements LevelTemplateModifier {
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

  adjust(item: LevelTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapLevelTemplateAdjuster implements LevelTemplateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LevelTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the level template steps in order and keeps a trace of each. */
export class LevelTemplateEngine {
  steps: LevelTemplateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelTemplateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LevelTemplate): number {
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

  evaluateAll(items: LevelTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLevelTemplateEngine(flagsValue: flags.Registry): LevelTemplateEngine {
  return new LevelTemplateEngine(
    [
      new RoundingLevelTemplateAdjuster(0.1),
      new MinimumLevelTemplateAdjuster(28.7),
      new TieredLevelTemplateAdjuster([640, 5005, 6460, 7595], [1.06, 0.91, 0.87, 0.81]),
      new FlaggedLevelTemplateAdjuster(flagsValue, "level-template-scheduled", 6.5),
      new CapLevelTemplateAdjuster(33445),
    ],
    [],
    0.6,
    85160,
  );
}
