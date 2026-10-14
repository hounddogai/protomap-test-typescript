import * as numbers from "../../../../kit/numbers.js";
import { PacingCheckpoint } from "./pacing-checkpoint.js";

/** One step of the pacing checkpoint calculation. */
export interface PacingCheckpointModifier {
  describe(): string;
  adjust(item: PacingCheckpoint, value: number): number;
}

export class RoundingPacingCheckpointAdjuster implements PacingCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PacingCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class NamePacingCheckpointAdjuster implements PacingCheckpointModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: PacingCheckpoint, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapPacingCheckpointAdjuster implements PacingCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PacingCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the pacing checkpoint steps in order and keeps a trace of each. */
export class PacingCheckpointEngine {
  steps: PacingCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PacingCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PacingCheckpoint): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: PacingCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPacingCheckpointEngine(): PacingCheckpointEngine {
  return new PacingCheckpointEngine(
    [
      new RoundingPacingCheckpointAdjuster(1),
      new NamePacingCheckpointAdjuster(new Map<string, number>([["retail", 0.77]])),
      new CapPacingCheckpointAdjuster(43729),
    ],
    [],
    2.2,
    3972.4,
  );
}
