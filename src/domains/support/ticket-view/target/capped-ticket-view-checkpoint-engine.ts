import * as numbers from "../../../../kit/numbers.js";
import { CappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

/** One step of the capped ticket view checkpoint calculation. */
export interface CappedTicketViewCheckpointStep {
  describe(): string;
  adjust(item: CappedTicketViewCheckpoint, value: number): number;
}

export class PercentCappedTicketViewCheckpointAdjuster implements CappedTicketViewCheckpointStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedTicketViewCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CappedTicketViewCheckpointExpiresAtOffsetAdjuster implements CappedTicketViewCheckpointStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: CappedTicketViewCheckpoint, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class RoundingCappedTicketViewCheckpointAdjuster implements CappedTicketViewCheckpointStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedTicketViewCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the capped ticket view checkpoint steps in order and keeps a trace of each. */
export class CappedTicketViewCheckpointEngine {
  steps: CappedTicketViewCheckpointStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedTicketViewCheckpointStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: CappedTicketViewCheckpoint): number {
    let current = item.netTotal();
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

  evaluateAll(items: CappedTicketViewCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultCappedTicketViewCheckpointEngine(): CappedTicketViewCheckpointEngine {
  return new CappedTicketViewCheckpointEngine(
    [
      new PercentCappedTicketViewCheckpointAdjuster(16.7),
      new CappedTicketViewCheckpointExpiresAtOffsetAdjuster(0.14),
      new RoundingCappedTicketViewCheckpointAdjuster(5),
    ],
    [],
    2.7,
    66854.1,
  );
}
