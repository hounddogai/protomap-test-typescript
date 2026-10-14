import * as clock from "../../../../kit/clock.js";
import {
  GlobalSuppressionAuditEngine,
  defaultGlobalSuppressionAuditEngine,
} from "./global-suppression-audit-engine.js";
import {
  GlobalSuppressionAuditValidator,
  defaultGlobalSuppressionAuditValidator,
} from "./global-suppression-audit-rules.js";
import { GlobalSuppressionAuditStore } from "./global-suppression-audit-store.js";

/** Moves global suppression audits through their life cycle and keeps a journal of what it did. */
export class GlobalSuppressionAuditWorkflow {
  store: GlobalSuppressionAuditStore;
  validator: GlobalSuppressionAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalSuppressionAuditEngine;

  constructor(
    store: GlobalSuppressionAuditStore,
    validator: GlobalSuppressionAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalSuppressionAuditEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global suppression audit ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newGlobalSuppressionAuditWorkflow(store: GlobalSuppressionAuditStore, clockValue: clock.Clock): GlobalSuppressionAuditWorkflow {
  return new GlobalSuppressionAuditWorkflow(
    store,
    defaultGlobalSuppressionAuditValidator(),
    clockValue,
    [],
    defaultGlobalSuppressionAuditEngine(),
  );
}
