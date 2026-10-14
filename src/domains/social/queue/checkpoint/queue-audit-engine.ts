import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { QueueAudit } from "./queue-audit.js";

/** One step of the queue audit calculation. */
export interface QueueAuditModifier {
  describe(): string;
  adjust(item: QueueAudit, value: number): number;
}

export class TieredQueueAuditAdjuster implements QueueAuditModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: QueueAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RegionQueueAuditAdjuster implements QueueAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: QueueAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class QueueAuditDiscountOffsetAdjuster implements QueueAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: QueueAudit, value: number): number {
    return value + item.discount * this.weight;
  }
}

export class FlaggedQueueAuditAdjuster implements QueueAuditModifier {
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

  adjust(item: QueueAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingQueueAuditAdjuster implements QueueAuditModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: QueueAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the queue audit steps in order and keeps a trace of each. */
export class QueueAuditEngine {
  steps: QueueAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: QueueAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: QueueAudit): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: QueueAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultQueueAuditEngine(flagsValue: flags.Registry): QueueAuditEngine {
  return new QueueAuditEngine(
    [
      new TieredQueueAuditAdjuster([933, 3068], [0.89, 1.09]),
      new RegionQueueAuditAdjuster(new Map<string, number>([["west", 1.04]])),
      new QueueAuditDiscountOffsetAdjuster(0.88),
      new FlaggedQueueAuditAdjuster(flagsValue, "queue-audit-fallback", 7.3),
      new RoundingQueueAuditAdjuster(0.5),
    ],
    [],
    1.3,
    2817.8,
  );
}
