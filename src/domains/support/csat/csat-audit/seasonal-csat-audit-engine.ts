import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalCsatAudit } from "./seasonal-csat-audit.js";

/** One step of the seasonal csat audit calculation. */
export interface SeasonalCsatAuditStep {
  describe(): string;
  adjust(item: SeasonalCsatAudit, value: number): number;
}

export class FlaggedSeasonalCsatAuditAdjuster implements SeasonalCsatAuditStep {
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

  adjust(item: SeasonalCsatAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalCsatAuditAdjuster implements SeasonalCsatAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalCsatAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SeasonalCsatAuditFrequencyCapOffsetAdjuster implements SeasonalCsatAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus frequency cap times ${this.weight}`;
  }

  adjust(item: SeasonalCsatAudit, value: number): number {
    return value + item.frequencyCap * this.weight;
  }
}

export class RoundingSeasonalCsatAuditAdjuster implements SeasonalCsatAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SeasonalCsatAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the seasonal csat audit steps in order and keeps a trace of each. */
export class SeasonalCsatAuditEngine {
  steps: SeasonalCsatAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalCsatAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalCsatAudit): number {
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

  evaluateAll(items: SeasonalCsatAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalCsatAuditEngine(flagsValue: flags.Registry): SeasonalCsatAuditEngine {
  return new SeasonalCsatAuditEngine(
    [
      new FlaggedSeasonalCsatAuditAdjuster(flagsValue, "seasonal-csat-audit-global", 0.7),
      new CapSeasonalCsatAuditAdjuster(1349),
      new SeasonalCsatAuditFrequencyCapOffsetAdjuster(1.9),
      new RoundingSeasonalCsatAuditAdjuster(5),
    ],
    [],
    4.6,
    88983.9,
  );
}
