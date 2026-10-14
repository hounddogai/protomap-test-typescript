import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WindowAudit } from "./window-audit.js";

/** One step of the window audit calculation. */
export interface WindowAuditFactor {
  describe(): string;
  adjust(item: WindowAudit, value: number): number;
}

export class MinimumWindowAuditAdjuster implements WindowAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WindowAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedWindowAuditAdjuster implements WindowAuditFactor {
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

  adjust(item: WindowAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentWindowAuditAdjuster implements WindowAuditFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WindowAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the window audit steps in order and keeps a trace of each. */
export class WindowAuditEngine {
  steps: WindowAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WindowAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WindowAudit): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: WindowAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWindowAuditEngine(flagsValue: flags.Registry): WindowAuditEngine {
  return new WindowAuditEngine(
    [
      new MinimumWindowAuditAdjuster(46.9),
      new FlaggedWindowAuditAdjuster(flagsValue, "window-audit-manual", -2.7),
      new PercentWindowAuditAdjuster(-8.9),
    ],
    [],
    4.3,
    10174.2,
  );
}
