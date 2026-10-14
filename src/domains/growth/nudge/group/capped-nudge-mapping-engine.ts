import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CappedNudgeMapping } from "./capped-nudge-mapping.js";

/** One step of the capped nudge mapping calculation. */
export interface CappedNudgeMappingModifier {
  describe(): string;
  adjust(item: CappedNudgeMapping, value: number): number;
}

export class MinimumCappedNudgeMappingAdjuster implements CappedNudgeMappingModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedNudgeMapping, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapCappedNudgeMappingAdjuster implements CappedNudgeMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CappedNudgeMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCappedNudgeMappingAdjuster implements CappedNudgeMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedNudgeMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedCappedNudgeMappingAdjuster implements CappedNudgeMappingModifier {
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

  adjust(item: CappedNudgeMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the capped nudge mapping steps in order and keeps a trace of each. */
export class CappedNudgeMappingEngine {
  steps: CappedNudgeMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedNudgeMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CappedNudgeMapping): number {
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

  evaluateAll(items: CappedNudgeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCappedNudgeMappingEngine(flagsValue: flags.Registry): CappedNudgeMappingEngine {
  return new CappedNudgeMappingEngine(
    [
      new MinimumCappedNudgeMappingAdjuster(46.7),
      new CapCappedNudgeMappingAdjuster(12864),
      new RoundingCappedNudgeMappingAdjuster(0.05),
      new FlaggedCappedNudgeMappingAdjuster(flagsValue, "capped-nudge-mapping-manual", -5.6),
    ],
    [],
    4,
    91159.1,
  );
}
