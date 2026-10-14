import * as numbers from "../../../../kit/numbers.js";
import { ProofRecord } from "./proof-record.js";

/** One step of the proof record calculation. */
export interface ProofRecordFactor {
  describe(): string;
  adjust(item: ProofRecord, value: number): number;
}

export class RoundingProofRecordAdjuster implements ProofRecordFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofRecord, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryProofRecordAdjuster implements ProofRecordFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ProofRecord, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapProofRecordAdjuster implements ProofRecordFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofRecord, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the proof record steps in order and keeps a trace of each. */
export class ProofRecordEngine {
  steps: ProofRecordFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofRecordFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofRecord): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: ProofRecord[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofRecordEngine(): ProofRecordEngine {
  return new ProofRecordEngine(
    [
      new RoundingProofRecordAdjuster(0.5),
      new CountryProofRecordAdjuster(
        new Map<string, number>([["north", 1.14], ["central", 1.19], ["east", 0.96]]),
      ),
      new CapProofRecordAdjuster(3785),
    ],
    [],
    1.8,
    26972.9,
  );
}
