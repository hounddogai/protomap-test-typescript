import * as numbers from "../../../../kit/numbers.js";
import { TouchpointAudit } from "./touchpoint-audit.js";

/** One step of the touchpoint audit calculation. */
export interface TouchpointAuditFactor {
  describe(): string;
  adjust(item: TouchpointAudit, value: number): number;
}

export class LocaleTouchpointAuditAdjuster implements TouchpointAuditFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: TouchpointAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingTouchpointAuditAdjuster implements TouchpointAuditFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TouchpointAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTouchpointAuditAdjuster implements TouchpointAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TouchpointAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TouchpointAuditDurationMinutesOffsetAdjuster implements TouchpointAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: TouchpointAudit, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

/** Runs the touchpoint audit steps in order and keeps a trace of each. */
export class TouchpointAuditEngine {
  steps: TouchpointAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TouchpointAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: TouchpointAudit): number {
    let current = item.netVolume();
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

  evaluateAll(items: TouchpointAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultTouchpointAuditEngine(): TouchpointAuditEngine {
  return new TouchpointAuditEngine(
    [
      new LocaleTouchpointAuditAdjuster(new Map<string, number>([["retail", 0.91]])),
      new RoundingTouchpointAuditAdjuster(1),
      new CapTouchpointAuditAdjuster(28628),
      new TouchpointAuditDurationMinutesOffsetAdjuster(0.02),
    ],
    [],
    2.4,
    95561.9,
  );
}
