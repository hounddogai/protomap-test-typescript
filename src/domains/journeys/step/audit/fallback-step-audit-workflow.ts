import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackStepAuditEngine, defaultFallbackStepAuditEngine } from "./fallback-step-audit-engine.js";
import { FallbackStepAuditValidator, defaultFallbackStepAuditValidator } from "./fallback-step-audit-rules.js";
import { FallbackStepAuditStore } from "./fallback-step-audit-store.js";

/** Moves fallback step audits through their life cycle and keeps a journal of what it did. */
export class FallbackStepAuditCoordinator {
  store: FallbackStepAuditStore;
  validator: FallbackStepAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackStepAuditEngine;

  constructor(
    store: FallbackStepAuditStore,
    validator: FallbackStepAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackStepAuditEngine,
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
      throw new Error(`fallback step audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback step audit ${code} not found`);
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
      throw new Error(`fallback step audit ${code} not found`);
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

export function newFallbackStepAuditCoordinator(store: FallbackStepAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackStepAuditCoordinator {
  return new FallbackStepAuditCoordinator(
    store,
    defaultFallbackStepAuditValidator(),
    clockValue,
    [],
    defaultFallbackStepAuditEngine(flagsValue),
  );
}
