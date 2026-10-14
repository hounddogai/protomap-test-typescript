import * as numbers from "../../../../kit/numbers.js";
import { PendingProofAudit } from "./pending-proof-audit.js";

/** One step of the pending proof audit calculation. */
export interface PendingProofAuditFactor {
  describe(): string;
  adjust(item: PendingProofAudit, value: number): number;
}

export class CapPendingProofAuditAdjuster implements PendingProofAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingProofAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PendingProofAuditThresholdOffsetAdjuster implements PendingProofAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PendingProofAudit, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class MinimumPendingProofAuditAdjuster implements PendingProofAuditFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingProofAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the pending proof audit steps in order and keeps a trace of each. */
export class PendingProofAuditEngine {
  steps: PendingProofAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingProofAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingProofAudit): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: PendingProofAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingProofAuditEngine(): PendingProofAuditEngine {
  return new PendingProofAuditEngine(
    [
      new CapPendingProofAuditAdjuster(28275),
      new PendingProofAuditThresholdOffsetAdjuster(0.49),
      new MinimumPendingProofAuditAdjuster(5.2),
    ],
    [],
    3.5,
    29457,
  );
}
