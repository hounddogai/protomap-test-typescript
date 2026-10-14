import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathAudit } from "./path-audit.js";

/** One step of the path audit calculation. */
export interface PathAuditAdjuster {
  describe(): string;
  adjust(item: PathAudit, value: number): number;
}

export class MinimumPathAuditAdjuster implements PathAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TitlePathAuditAdjuster implements PathAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: PathAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPathAuditAdjuster implements PathAuditAdjuster {
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

  adjust(item: PathAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPathAuditAdjuster implements PathAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the path audit steps in order and keeps a trace of each. */
export class PathAuditEngine {
  steps: PathAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PathAudit): number {
    let current = item.weightedValue();
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

  evaluateAll(items: PathAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPathAuditEngine(flagsValue: flags.Registry): PathAuditEngine {
  return new PathAuditEngine(
    [
      new MinimumPathAuditAdjuster(49.1),
      new TitlePathAuditAdjuster(new Map<string, number>([["south", 1.06], ["north", 1.14], ["retail", 0.99]])),
      new FlaggedPathAuditAdjuster(flagsValue, "path-audit-global", -4.9),
      new CapPathAuditAdjuster(29838),
    ],
    [],
    1.2,
    57453.4,
  );
}
