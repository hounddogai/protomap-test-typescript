import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathAuditEngine, defaultPathAuditEngine } from "./path-audit-engine.js";
import { PathAuditValidator, defaultPathAuditValidator } from "./path-audit-rules.js";
import { PathAuditStore } from "./path-audit-store.js";

/** Moves path audits through their life cycle and keeps a journal of what it did. */
export class PathAuditWorkflow {
  store: PathAuditStore;
  validator: PathAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathAuditEngine;

  constructor(
    store: PathAuditStore,
    validator: PathAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathAuditEngine,
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
      throw new Error(`path audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPathAuditWorkflow(store: PathAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathAuditWorkflow {
  return new PathAuditWorkflow(store, defaultPathAuditValidator(), clockValue, [], defaultPathAuditEngine(flagsValue));
}
