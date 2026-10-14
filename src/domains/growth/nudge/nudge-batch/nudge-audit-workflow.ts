import * as clock from "../../../../kit/clock.js";
import { NudgeAuditEngine, defaultNudgeAuditEngine } from "./nudge-audit-engine.js";
import { NudgeAuditValidator, defaultNudgeAuditValidator } from "./nudge-audit-rules.js";
import { NudgeAuditStore } from "./nudge-audit-store.js";

/** Moves nudge audits through their life cycle and keeps a journal of what it did. */
export class NudgeAuditService {
  store: NudgeAuditStore;
  validator: NudgeAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeAuditEngine;

  constructor(
    store: NudgeAuditStore,
    validator: NudgeAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeAuditEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge audit ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newNudgeAuditService(store: NudgeAuditStore, clockValue: clock.Clock): NudgeAuditService {
  return new NudgeAuditService(store, defaultNudgeAuditValidator(), clockValue, [], defaultNudgeAuditEngine());
}
