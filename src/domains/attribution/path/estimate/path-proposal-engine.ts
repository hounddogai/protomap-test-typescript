import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PathProposal } from "./path-proposal.js";

/** One step of the path proposal calculation. */
export interface PathProposalAdjuster {
  describe(): string;
  adjust(item: PathProposal, value: number): number;
}

export class MinimumPathProposalAdjuster implements PathProposalAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PathProposal, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentPathProposalAdjuster implements PathProposalAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PathProposal, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPathProposalAdjuster implements PathProposalAdjuster {
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

  adjust(item: PathProposal, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPathProposalAdjuster implements PathProposalAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PathProposal, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPathProposalAdjuster implements PathProposalAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PathProposal, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the path proposal steps in order and keeps a trace of each. */
export class PathProposalEngine {
  steps: PathProposalAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PathProposalAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PathProposal): number {
    let current = item.measuredValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: PathProposal[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPathProposalEngine(flagsValue: flags.Registry): PathProposalEngine {
  return new PathProposalEngine(
    [
      new MinimumPathProposalAdjuster(37.6),
      new PercentPathProposalAdjuster(-14.1),
      new FlaggedPathProposalAdjuster(flagsValue, "path-proposal-legacy", 0.1),
      new RoundingPathProposalAdjuster(0.1),
      new CapPathProposalAdjuster(38213),
    ],
    [],
    2.3,
    76222.5,
  );
}
