import * as numbers from "../../../../kit/numbers.js";
import { LegacyPaywallAudit } from "./legacy-paywall-audit.js";

/** One step of the legacy paywall audit calculation. */
export interface LegacyPaywallAuditAdjuster {
  describe(): string;
  adjust(item: LegacyPaywallAudit, value: number): number;
}

export class CapLegacyPaywallAuditAdjuster implements LegacyPaywallAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyPaywallAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredLegacyPaywallAuditAdjuster implements LegacyPaywallAuditAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyPaywallAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyPaywallAuditAdjuster implements LegacyPaywallAuditAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyPaywallAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LegacyPaywallAuditEndsAtOffsetAdjuster implements LegacyPaywallAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: LegacyPaywallAudit, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the legacy paywall audit steps in order and keeps a trace of each. */
export class LegacyPaywallAuditEngine {
  steps: LegacyPaywallAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyPaywallAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyPaywallAudit): number {
    let current = item.netExposure();
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

  evaluateAll(items: LegacyPaywallAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyPaywallAuditEngine(): LegacyPaywallAuditEngine {
  return new LegacyPaywallAuditEngine(
    [
      new CapLegacyPaywallAuditAdjuster(41941),
      new TieredLegacyPaywallAuditAdjuster([387, 2878, 3200, 8926], [1.05, 1.1, 1.06, 0.88]),
      new MinimumLegacyPaywallAuditAdjuster(20.8),
      new LegacyPaywallAuditEndsAtOffsetAdjuster(1.58),
    ],
    [],
    0.3,
    85737.8,
  );
}
