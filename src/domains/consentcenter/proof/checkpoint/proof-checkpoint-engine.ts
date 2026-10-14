import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ProofCheckpoint } from "./proof-checkpoint.js";

/** One step of the proof checkpoint calculation. */
export interface ProofCheckpointModifier {
  describe(): string;
  adjust(item: ProofCheckpoint, value: number): number;
}

export class PercentProofCheckpointAdjuster implements ProofCheckpointModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ProofCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingProofCheckpointAdjuster implements ProofCheckpointModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofCheckpoint, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedProofCheckpointAdjuster implements ProofCheckpointModifier {
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

  adjust(item: ProofCheckpoint, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapProofCheckpointAdjuster implements ProofCheckpointModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofCheckpoint, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof checkpoint steps in order and keeps a trace of each. */
export class ProofCheckpointEngine {
  steps: ProofCheckpointModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofCheckpointModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ProofCheckpoint): number {
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

  evaluateAll(items: ProofCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultProofCheckpointEngine(flagsValue: flags.Registry): ProofCheckpointEngine {
  return new ProofCheckpointEngine(
    [
      new PercentProofCheckpointAdjuster(-18),
      new RoundingProofCheckpointAdjuster(0.1),
      new FlaggedProofCheckpointAdjuster(flagsValue, "proof-checkpoint-scheduled", 9.1),
      new CapProofCheckpointAdjuster(42201),
    ],
    [],
    0.6,
    33044.2,
  );
}
