import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultInsightAuditEngine, defaultDefaultInsightAuditEngine } from "./default-insight-audit-engine.js";
import { DefaultInsightAuditValidator, defaultDefaultInsightAuditValidator } from "./default-insight-audit-rules.js";
import { DefaultInsightAuditStore } from "./default-insight-audit-store.js";

/** Moves default insight audits through their life cycle and keeps a journal of what it did. */
export class DefaultInsightAuditCoordinator {
  store: DefaultInsightAuditStore;
  validator: DefaultInsightAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultInsightAuditEngine;

  constructor(
    store: DefaultInsightAuditStore,
    validator: DefaultInsightAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultInsightAuditEngine,
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
      throw new Error(`default insight audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default insight audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default insight audit ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newDefaultInsightAuditCoordinator(store: DefaultInsightAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultInsightAuditCoordinator {
  return new DefaultInsightAuditCoordinator(
    store,
    defaultDefaultInsightAuditValidator(),
    clockValue,
    [],
    defaultDefaultInsightAuditEngine(flagsValue),
  );
}
