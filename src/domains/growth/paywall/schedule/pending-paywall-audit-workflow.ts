import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingPaywallAuditEngine, defaultPendingPaywallAuditEngine } from "./pending-paywall-audit-engine.js";
import { PendingPaywallAuditValidator, defaultPendingPaywallAuditValidator } from "./pending-paywall-audit-rules.js";
import { PendingPaywallAuditStore } from "./pending-paywall-audit-store.js";

/** Moves pending paywall audits through their life cycle and keeps a journal of what it did. */
export class PendingPaywallAuditService {
  store: PendingPaywallAuditStore;
  validator: PendingPaywallAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingPaywallAuditEngine;

  constructor(
    store: PendingPaywallAuditStore,
    validator: PendingPaywallAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingPaywallAuditEngine,
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
      throw new Error(`pending paywall audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending paywall audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending paywall audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPendingPaywallAuditService(store: PendingPaywallAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingPaywallAuditService {
  return new PendingPaywallAuditService(
    store,
    defaultPendingPaywallAuditValidator(),
    clockValue,
    [],
    defaultPendingPaywallAuditEngine(flagsValue),
  );
}
