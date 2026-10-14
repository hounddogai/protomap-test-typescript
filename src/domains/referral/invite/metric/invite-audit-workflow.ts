import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InviteAuditEngine, defaultInviteAuditEngine } from "./invite-audit-engine.js";
import { InviteAuditValidator, defaultInviteAuditValidator } from "./invite-audit-rules.js";
import { InviteAuditStore } from "./invite-audit-store.js";

/** Moves invite audits through their life cycle and keeps a journal of what it did. */
export class InviteAuditWorkflow {
  store: InviteAuditStore;
  validator: InviteAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteAuditEngine;

  constructor(
    store: InviteAuditStore,
    validator: InviteAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteAuditEngine,
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
      throw new Error(`invite audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite audit ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInviteAuditWorkflow(store: InviteAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): InviteAuditWorkflow {
  return new InviteAuditWorkflow(
    store,
    defaultInviteAuditValidator(),
    clockValue,
    [],
    defaultInviteAuditEngine(flagsValue),
  );
}
