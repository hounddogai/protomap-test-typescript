import * as numbers from "../../../../kit/numbers.js";
import { PendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

/** One step of the pending ticket view checkpoint calculation. */
export interface PendingTicketViewCheckpointAdjuster {
  describe(): string;
  adjust(item: PendingTicketViewCheckpoint, value: number): number;
}

export class RoundingPendingTicketViewCheckpointAdjuster implements PendingTicketViewCheckpointAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PendingTicketViewCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PendingTicketViewCheckpointRatioOffsetAdjuster implements PendingTicketViewCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: PendingTicketViewCheckpoint, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class LocalePendingTicketViewCheckpointAdjuster implements PendingTicketViewCheckpointAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: PendingTicketViewCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the pending ticket view checkpoint steps in order and keeps a trace of each. */
export class PendingTicketViewCheckpointEngine {
  steps: PendingTicketViewCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTicketViewCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingTicketViewCheckpoint): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: PendingTicketViewCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingTicketViewCheckpointEngine(): PendingTicketViewCheckpointEngine {
  return new PendingTicketViewCheckpointEngine(
    [
      new RoundingPendingTicketViewCheckpointAdjuster(0.05),
      new PendingTicketViewCheckpointRatioOffsetAdjuster(0.32),
      new LocalePendingTicketViewCheckpointAdjuster(new Map<string, number>([["online", 1.24]])),
    ],
    [],
    0.8,
    84154.5,
  );
}
