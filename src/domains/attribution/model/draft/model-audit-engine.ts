import * as numbers from "../../../../kit/numbers.js";
import { ModelAudit } from "./model-audit.js";

/** One step of the model audit calculation. */
export interface ModelAuditAdjuster {
  describe(): string;
  adjust(item: ModelAudit, value: number): number;
}

export class ModelAuditPriorityOffsetAdjuster implements ModelAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ModelAudit, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class RoundingModelAuditAdjuster implements ModelAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapModelAuditAdjuster implements ModelAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the model audit steps in order and keeps a trace of each. */
export class ModelAuditEngine {
  steps: ModelAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelAudit): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ModelAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelAuditEngine(): ModelAuditEngine {
  return new ModelAuditEngine(
    [
      new ModelAuditPriorityOffsetAdjuster(0.02),
      new RoundingModelAuditAdjuster(1),
      new CapModelAuditAdjuster(34894),
    ],
    [],
    2.6,
    85208.4,
  );
}
