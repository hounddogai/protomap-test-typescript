import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalLevelProposal } from "./seasonal-level-proposal.js";

/** One step of the seasonal level proposal calculation. */
export interface SeasonalLevelProposalAdjuster {
  describe(): string;
  adjust(item: SeasonalLevelProposal, value: number): number;
}

export class FlaggedSeasonalLevelProposalAdjuster implements SeasonalLevelProposalAdjuster {
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

  adjust(item: SeasonalLevelProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapSeasonalLevelProposalAdjuster implements SeasonalLevelProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalLevelProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentSeasonalLevelProposalAdjuster implements SeasonalLevelProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: SeasonalLevelProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class SeasonalLevelProposalCreatedAtOffsetAdjuster implements SeasonalLevelProposalAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: SeasonalLevelProposal, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the seasonal level proposal steps in order and keeps a trace of each. */
export class SeasonalLevelProposalEngine {
  steps: SeasonalLevelProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalLevelProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalLevelProposal): number {
    let current = item.netLoad();
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

  evaluateAll(items: SeasonalLevelProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalLevelProposalEngine(flagsValue: flags.Registry): SeasonalLevelProposalEngine {
  return new SeasonalLevelProposalEngine(
    [
      new FlaggedSeasonalLevelProposalAdjuster(flagsValue, "seasonal-level-proposal-global", -0),
      new CapSeasonalLevelProposalAdjuster(10495),
      new PercentSeasonalLevelProposalAdjuster(-19),
      new SeasonalLevelProposalCreatedAtOffsetAdjuster(0.91),
    ],
    [],
    4.7,
    56204.9,
  );
}
