import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SenderAudit } from "./sender-audit.js";

/** One step of the sender audit calculation. */
export interface SenderAuditAdjuster {
  describe(): string;
  adjust(item: SenderAudit, value: number): number;
}

export class SegmentSenderAuditAdjuster implements SenderAuditAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: SenderAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingSenderAuditAdjuster implements SenderAuditAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: SenderAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SenderAuditBidOffsetAdjuster implements SenderAuditAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: SenderAudit, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class CapSenderAuditAdjuster implements SenderAuditAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SenderAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedSenderAuditAdjuster implements SenderAuditAdjuster {
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

  adjust(item: SenderAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the sender audit steps in order and keeps a trace of each. */
export class SenderAuditEngine {
  steps: SenderAuditAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SenderAuditAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: SenderAudit): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: SenderAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultSenderAuditEngine(flagsValue: flags.Registry): SenderAuditEngine {
  return new SenderAuditEngine(
    [
      new SegmentSenderAuditAdjuster(new Map<string, number>([["retail", 0.77]])),
      new RoundingSenderAuditAdjuster(0.05),
      new SenderAuditBidOffsetAdjuster(0.69),
      new CapSenderAuditAdjuster(25698),
      new FlaggedSenderAuditAdjuster(flagsValue, "sender-audit-rolling", -8.5),
    ],
    [],
    3.2,
    35066.1,
  );
}
