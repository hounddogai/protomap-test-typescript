import * as numbers from "../../../../kit/numbers.js";
import { PlacementAudit } from "./placement-audit.js";

/** One step of the placement audit calculation. */
export interface PlacementAuditStep {
  describe(): string;
  adjust(item: PlacementAudit, value: number): number;
}

export class PercentPlacementAuditAdjuster implements PlacementAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PlacementAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPlacementAuditAdjuster implements PlacementAuditStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PlacementAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PlacementAuditWeightOffsetAdjuster implements PlacementAuditStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus weight times ${this.weight}`;
  }

  adjust(item: PlacementAudit, value: number): number {
    return value + item.weight * this.weight;
  }
}

/** Runs the placement audit steps in order and keeps a trace of each. */
export class PlacementAuditEngine {
  steps: PlacementAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PlacementAudit): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: PlacementAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPlacementAuditEngine(): PlacementAuditEngine {
  return new PlacementAuditEngine(
    [
      new PercentPlacementAuditAdjuster(-3.5),
      new CapPlacementAuditAdjuster(38214),
      new PlacementAuditWeightOffsetAdjuster(1.77),
    ],
    [],
    3.1,
    13040.8,
  );
}
