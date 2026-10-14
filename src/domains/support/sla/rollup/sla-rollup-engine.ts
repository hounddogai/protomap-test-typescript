import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaRollup } from "./sla-rollup.js";

/** One step of the sla rollup calculation. */
export interface SlaRollupAdjuster {
  describe(): string;
  adjust(item: SlaRollup, value: number): number;
}

export class PercentSlaRollupAdjuster implements SlaRollupAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaRollup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingSlaRollupAdjuster implements SlaRollupAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaRollup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedSlaRollupAdjuster implements SlaRollupAdjuster {
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

  adjust(item: SlaRollup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class SlaRollupBatchSizeOffsetAdjuster implements SlaRollupAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: SlaRollup, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

/** Runs the sla rollup steps in order and keeps a trace of each. */
export class SlaRollupEngine {
  steps: SlaRollupAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaRollupAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SlaRollup): number {
    let current = item.measuredValue();
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

  evaluateAll(items: SlaRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSlaRollupEngine(flagsValue: flags.Registry): SlaRollupEngine {
  return new SlaRollupEngine(
    [
      new PercentSlaRollupAdjuster(13.9),
      new RoundingSlaRollupAdjuster(0.05),
      new FlaggedSlaRollupAdjuster(flagsValue, "sla-rollup-legacy", -1.2),
      new SlaRollupBatchSizeOffsetAdjuster(1.16),
    ],
    [],
    1.3,
    67690.5,
  );
}
