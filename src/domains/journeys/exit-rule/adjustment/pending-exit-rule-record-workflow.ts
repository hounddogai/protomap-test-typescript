import * as clock from "../../../../kit/clock.js";
import {
  PendingExitRuleRecordEngine,
  defaultPendingExitRuleRecordEngine,
} from "./pending-exit-rule-record-engine.js";
import {
  PendingExitRuleRecordValidator,
  defaultPendingExitRuleRecordValidator,
} from "./pending-exit-rule-record-rules.js";
import { PendingExitRuleRecordStore } from "./pending-exit-rule-record-store.js";

/** Moves pending exit rule records through their life cycle and keeps a journal of what it did. */
export class PendingExitRuleRecordManager {
  store: PendingExitRuleRecordStore;
  validator: PendingExitRuleRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingExitRuleRecordEngine;

  constructor(
    store: PendingExitRuleRecordStore,
    validator: PendingExitRuleRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingExitRuleRecordEngine,
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
      throw new Error(`pending exit rule record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending exit rule record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending exit rule record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingExitRuleRecordManager(store: PendingExitRuleRecordStore, clockValue: clock.Clock): PendingExitRuleRecordManager {
  return new PendingExitRuleRecordManager(
    store,
    defaultPendingExitRuleRecordValidator(),
    clockValue,
    [],
    defaultPendingExitRuleRecordEngine(),
  );
}
