import * as numbers from "../../../../kit/numbers.js";
import { ProofAudit } from "./proof-audit.js";

/** One step of the proof audit calculation. */
export interface ProofAuditFactor {
  describe(): string;
  adjust(item: ProofAudit, value: number): number;
}

export class RoundingProofAuditAdjuster implements ProofAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ProofAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleProofAuditAdjuster implements ProofAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ProofAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredProofAuditAdjuster implements ProofAuditFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ProofAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapProofAuditAdjuster implements ProofAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ProofAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ProofAuditCeilingOffsetAdjuster implements ProofAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ProofAudit, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

/** Runs the proof audit steps in order and keeps a trace of each. */
export class ProofAuditEngine {
  steps: ProofAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ProofAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ProofAudit): number {
    let current = item.netTotal();
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

  evaluateAll(items: ProofAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultProofAuditEngine(): ProofAuditEngine {
  return new ProofAuditEngine(
    [
      new RoundingProofAuditAdjuster(0.5),
      new TitleProofAuditAdjuster(new Map<string, number>([["retail", 0.77], ["west", 0.9]])),
      new TieredProofAuditAdjuster([11, 113, 4408], [0.96, 1.12, 0.97]),
      new CapProofAuditAdjuster(8586),
      new ProofAuditCeilingOffsetAdjuster(1),
    ],
    [],
    1.6,
    5868.6,
  );
}
