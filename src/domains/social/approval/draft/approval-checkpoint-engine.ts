import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ApprovalCheckpoint } from "./approval-checkpoint.js";

/** One step of the approval checkpoint calculation. */
export interface ApprovalCheckpointFactor {
  describe(): string;
  adjust(item: ApprovalCheckpoint, value: number): number;
}

export class ApprovalCheckpointSequenceOffsetAdjuster implements ApprovalCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: ApprovalCheckpoint, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class TieredApprovalCheckpointAdjuster implements ApprovalCheckpointFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ApprovalCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentApprovalCheckpointAdjuster implements ApprovalCheckpointFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ApprovalCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameApprovalCheckpointAdjuster implements ApprovalCheckpointFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: ApprovalCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedApprovalCheckpointAdjuster implements ApprovalCheckpointFactor {
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

  adjust(item: ApprovalCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the approval checkpoint steps in order and keeps a trace of each. */
export class ApprovalCheckpointEngine {
  steps: ApprovalCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ApprovalCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ApprovalCheckpoint): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ApprovalCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultApprovalCheckpointEngine(flagsValue: flags.Registry): ApprovalCheckpointEngine {
  return new ApprovalCheckpointEngine(
    [
      new ApprovalCheckpointSequenceOffsetAdjuster(0.6),
      new TieredApprovalCheckpointAdjuster([249, 4087, 8780], [1.08, 0.96, 1.12]),
      new PercentApprovalCheckpointAdjuster(-22.3),
      new NameApprovalCheckpointAdjuster(new Map<string, number>([["west", 1.05]])),
      new FlaggedApprovalCheckpointAdjuster(flagsValue, "approval-checkpoint-batched", 3.3),
    ],
    [],
    3.7,
    88846.1,
  );
}
