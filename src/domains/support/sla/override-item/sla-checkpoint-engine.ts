import * as numbers from "../../../../kit/numbers.js";
import { SlaCheckpoint } from "./sla-checkpoint.js";

/** One step of the sla checkpoint calculation. */
export interface SlaCheckpointFactor {
  describe(): string;
  adjust(item: SlaCheckpoint, value: number): number;
}

export class CapSlaCheckpointAdjuster implements SlaCheckpointFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SlaCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class SlaCheckpointSendAtOffsetAdjuster implements SlaCheckpointFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: SlaCheckpoint, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class RoundingSlaCheckpointAdjuster implements SlaCheckpointFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SlaCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the sla checkpoint steps in order and keeps a trace of each. */
export class SlaCheckpointEngine {
  steps: SlaCheckpointFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SlaCheckpointFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: SlaCheckpoint): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: SlaCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultSlaCheckpointEngine(): SlaCheckpointEngine {
  return new SlaCheckpointEngine(
    [
      new CapSlaCheckpointAdjuster(32454),
      new SlaCheckpointSendAtOffsetAdjuster(0.5),
      new RoundingSlaCheckpointAdjuster(1),
    ],
    [],
    2.2,
    96366.9,
  );
}
