import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MacroProposal } from "./macro-proposal.js";

/** One step of the macro proposal calculation. */
export interface MacroProposalStep {
  describe(): string;
  adjust(item: MacroProposal, value: number): number;
}

export class MinimumMacroProposalAdjuster implements MacroProposalStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: MacroProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredMacroProposalAdjuster implements MacroProposalStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: MacroProposal, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapMacroProposalAdjuster implements MacroProposalStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: MacroProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedMacroProposalAdjuster implements MacroProposalStep {
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

  adjust(item: MacroProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MacroProposalFloorValueOffsetAdjuster implements MacroProposalStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: MacroProposal, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the macro proposal steps in order and keeps a trace of each. */
export class MacroProposalEngine {
  steps: MacroProposalStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MacroProposalStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: MacroProposal): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: MacroProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultMacroProposalEngine(flagsValue: flags.Registry): MacroProposalEngine {
  return new MacroProposalEngine(
    [
      new MinimumMacroProposalAdjuster(32.6),
      new TieredMacroProposalAdjuster([44, 5705, 6536, 7025], [1.1, 1.02, 0.83, 1.11]),
      new CapMacroProposalAdjuster(49201),
      new FlaggedMacroProposalAdjuster(flagsValue, "macro-proposal-rolling", 8.4),
      new MacroProposalFloorValueOffsetAdjuster(0.53),
    ],
    [],
    4.5,
    14756.5,
  );
}
