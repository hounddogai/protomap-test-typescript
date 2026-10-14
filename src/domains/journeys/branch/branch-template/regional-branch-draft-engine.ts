import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalBranchDraft } from "./regional-branch-draft.js";

/** One step of the regional branch draft calculation. */
export interface RegionalBranchDraftAdjuster {
  describe(): string;
  adjust(item: RegionalBranchDraft, value: number): number;
}

export class RoundingRegionalBranchDraftAdjuster implements RegionalBranchDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalBranchDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapRegionalBranchDraftAdjuster implements RegionalBranchDraftAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalBranchDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRegionalBranchDraftAdjuster implements RegionalBranchDraftAdjuster {
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

  adjust(item: RegionalBranchDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional branch draft steps in order and keeps a trace of each. */
export class RegionalBranchDraftEngine {
  steps: RegionalBranchDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalBranchDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RegionalBranchDraft): number {
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

  evaluateAll(items: RegionalBranchDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRegionalBranchDraftEngine(flagsValue: flags.Registry): RegionalBranchDraftEngine {
  return new RegionalBranchDraftEngine(
    [
      new RoundingRegionalBranchDraftAdjuster(0.5),
      new CapRegionalBranchDraftAdjuster(33485),
      new FlaggedRegionalBranchDraftAdjuster(flagsValue, "regional-branch-draft-weighted", 6),
    ],
    [],
    0.3,
    35222.4,
  );
}
