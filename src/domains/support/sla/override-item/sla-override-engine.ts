import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SlaOverride } from "./sla-override.js";

/** One step of the sla override calculation. */
export interface SlaOverrideAdjuster {
  describe(): string;
  adjust(item: SlaOverride, value: number): number;
}

export class PercentSlaOverrideAdjuster implements SlaOverrideAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SlaOverride, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedSlaOverrideAdjuster implements SlaOverrideAdjuster {
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

  adjust(item: SlaOverride, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumSlaOverrideAdjuster implements SlaOverrideAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SlaOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the sla override steps in order and keeps a trace of each. */
export class SlaOverrideEngine {
  steps: SlaOverrideAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaOverrideAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaOverride): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: SlaOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaOverrideEngine(flagsValue: flags.Registry): SlaOverrideEngine {
  return new SlaOverrideEngine(
    [
      new PercentSlaOverrideAdjuster(-3.8),
      new FlaggedSlaOverrideAdjuster(flagsValue, "sla-override-pending", 7.9),
      new MinimumSlaOverrideAdjuster(0.3),
    ],
    [],
    4.9,
    51856.1,
  );
}
