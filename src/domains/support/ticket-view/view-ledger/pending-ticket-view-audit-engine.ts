import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingTicketViewAudit } from "./pending-ticket-view-audit.js";

/** One step of the pending ticket view audit calculation. */
export interface PendingTicketViewAuditFactor {
  describe(): string;
  adjust(item: PendingTicketViewAudit, value: number): number;
}

export class PendingTicketViewAuditScoreOffsetAdjuster implements PendingTicketViewAuditFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: PendingTicketViewAudit, value: number): number {
    return value + item.score * this.weight;
  }
}

export class CapPendingTicketViewAuditAdjuster implements PendingTicketViewAuditFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingTicketViewAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedPendingTicketViewAuditAdjuster implements PendingTicketViewAuditFactor {
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

  adjust(item: PendingTicketViewAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending ticket view audit steps in order and keeps a trace of each. */
export class PendingTicketViewAuditEngine {
  steps: PendingTicketViewAuditFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingTicketViewAuditFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PendingTicketViewAudit): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PendingTicketViewAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPendingTicketViewAuditEngine(flagsValue: flags.Registry): PendingTicketViewAuditEngine {
  return new PendingTicketViewAuditEngine(
    [
      new PendingTicketViewAuditScoreOffsetAdjuster(1.52),
      new CapPendingTicketViewAuditAdjuster(49301),
      new FlaggedPendingTicketViewAuditAdjuster(flagsValue, "pending-ticket-view-audit-tiered", 2.7),
    ],
    [],
    3.5,
    44522.6,
  );
}
