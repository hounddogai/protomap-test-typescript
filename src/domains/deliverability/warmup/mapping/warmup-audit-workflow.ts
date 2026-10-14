import * as clock from "../../../../kit/clock.js";
import { WarmupAuditEngine, defaultWarmupAuditEngine } from "./warmup-audit-engine.js";
import { WarmupAuditValidator, defaultWarmupAuditValidator } from "./warmup-audit-rules.js";
import { WarmupAuditStore } from "./warmup-audit-store.js";

/** Moves warmup audits through their life cycle and keeps a journal of what it did. */
export class WarmupAuditManager {
  store: WarmupAuditStore;
  validator: WarmupAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupAuditEngine;

  constructor(
    store: WarmupAuditStore,
    validator: WarmupAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupAuditEngine,
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
      throw new Error(`warmup audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup audit ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWarmupAuditManager(store: WarmupAuditStore, clockValue: clock.Clock): WarmupAuditManager {
  return new WarmupAuditManager(store, defaultWarmupAuditValidator(), clockValue, [], defaultWarmupAuditEngine());
}
