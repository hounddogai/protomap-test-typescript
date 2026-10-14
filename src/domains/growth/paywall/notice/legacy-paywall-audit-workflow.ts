import * as clock from "../../../../kit/clock.js";
import { LegacyPaywallAuditEngine, defaultLegacyPaywallAuditEngine } from "./legacy-paywall-audit-engine.js";
import { LegacyPaywallAuditValidator, defaultLegacyPaywallAuditValidator } from "./legacy-paywall-audit-rules.js";
import { LegacyPaywallAuditStore } from "./legacy-paywall-audit-store.js";

/** Moves legacy paywall audits through their life cycle and keeps a journal of what it did. */
export class LegacyPaywallAuditWorkflow {
  store: LegacyPaywallAuditStore;
  validator: LegacyPaywallAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPaywallAuditEngine;

  constructor(
    store: LegacyPaywallAuditStore,
    validator: LegacyPaywallAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPaywallAuditEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy paywall audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy paywall audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy paywall audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyPaywallAuditWorkflow(store: LegacyPaywallAuditStore, clockValue: clock.Clock): LegacyPaywallAuditWorkflow {
  return new LegacyPaywallAuditWorkflow(
    store,
    defaultLegacyPaywallAuditValidator(),
    clockValue,
    [],
    defaultLegacyPaywallAuditEngine(),
  );
}
