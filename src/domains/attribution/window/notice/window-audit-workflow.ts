import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowAuditEngine, defaultWindowAuditEngine } from "./window-audit-engine.js";
import { WindowAuditValidator, defaultWindowAuditValidator } from "./window-audit-rules.js";
import { WindowAuditStore } from "./window-audit-store.js";

/** Moves window audits through their life cycle and keeps a journal of what it did. */
export class WindowAuditWorkflow {
  store: WindowAuditStore;
  validator: WindowAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowAuditEngine;

  constructor(
    store: WindowAuditStore,
    validator: WindowAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowAuditEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window audit ${code} not found`);
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
      throw new Error(`window audit ${code} not found`);
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

export function newWindowAuditWorkflow(store: WindowAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowAuditWorkflow {
  return new WindowAuditWorkflow(
    store,
    defaultWindowAuditValidator(),
    clockValue,
    [],
    defaultWindowAuditEngine(flagsValue),
  );
}
