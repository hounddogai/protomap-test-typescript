import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalTouchpointAudit } from "./regional-touchpoint-audit.js";

/** One step of the regional touchpoint audit calculation. */
export interface RegionalTouchpointAuditFactor {
  describe(): string;
  adjust(item: RegionalTouchpointAudit, value: number): number;
}

export class FlaggedRegionalTouchpointAuditAdjuster implements RegionalTouchpointAuditFactor {
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

  adjust(item: RegionalTouchpointAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RegionalTouchpointAuditLimitOffsetAdjuster implements RegionalTouchpointAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: RegionalTouchpointAudit, value: number): number {
    return value + item.limit * this.weight;
  }
}

export class CapRegionalTouchpointAuditAdjuster implements RegionalTouchpointAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalTouchpointAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the regional touchpoint audit steps in order and keeps a trace of each. */
export class RegionalTouchpointAuditEngine {
  steps: RegionalTouchpointAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalTouchpointAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalTouchpointAudit): number {
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

  evaluateAll(items: RegionalTouchpointAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalTouchpointAuditEngine(flagsValue: flags.Registry): RegionalTouchpointAuditEngine {
  return new RegionalTouchpointAuditEngine(
    [
      new FlaggedRegionalTouchpointAuditAdjuster(flagsValue, "regional-touchpoint-audit-legacy", 3),
      new RegionalTouchpointAuditLimitOffsetAdjuster(0.79),
      new CapRegionalTouchpointAuditAdjuster(29127),
    ],
    [],
    4.3,
    98847.4,
  );
}
