import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LevelAudit } from "./level-audit.js";

/** One step of the level audit calculation. */
export interface LevelAuditModifier {
  describe(): string;
  adjust(item: LevelAudit, value: number): number;
}

export class MinimumLevelAuditAdjuster implements LevelAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LevelAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLevelAuditAdjuster implements LevelAuditModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LevelAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLevelAuditAdjuster implements LevelAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LevelAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLevelAuditAdjuster implements LevelAuditModifier {
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

  adjust(item: LevelAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLevelAuditAdjuster implements LevelAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LevelAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the level audit steps in order and keeps a trace of each. */
export class LevelAuditEngine {
  steps: LevelAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LevelAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LevelAudit): number {
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

  evaluateAll(items: LevelAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLevelAuditEngine(flagsValue: flags.Registry): LevelAuditEngine {
  return new LevelAuditEngine(
    [
      new MinimumLevelAuditAdjuster(3),
      new PercentLevelAuditAdjuster(-5.5),
      new RoundingLevelAuditAdjuster(1),
      new FlaggedLevelAuditAdjuster(flagsValue, "level-audit-seasonal", -1.7),
      new TieredLevelAuditAdjuster([1843, 1859, 6006, 7851], [0.99, 1.16, 0.81, 1.06]),
    ],
    [],
    1.7,
    48411.3,
  );
}
