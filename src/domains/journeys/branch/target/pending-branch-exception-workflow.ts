import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingBranchExceptionEngine,
  defaultPendingBranchExceptionEngine,
} from "./pending-branch-exception-engine.js";
import {
  PendingBranchExceptionValidator,
  defaultPendingBranchExceptionValidator,
} from "./pending-branch-exception-rules.js";
import { PendingBranchExceptionStore } from "./pending-branch-exception-store.js";

/** Moves pending branch exceptions through their life cycle and keeps a journal of what it did. */
export class PendingBranchExceptionManager {
  store: PendingBranchExceptionStore;
  validator: PendingBranchExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBranchExceptionEngine;

  constructor(
    store: PendingBranchExceptionStore,
    validator: PendingBranchExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBranchExceptionEngine,
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
      throw new Error(`pending branch exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending branch exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending branch exception ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingBranchExceptionManager(store: PendingBranchExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingBranchExceptionManager {
  return new PendingBranchExceptionManager(
    store,
    defaultPendingBranchExceptionValidator(),
    clockValue,
    [],
    defaultPendingBranchExceptionEngine(flagsValue),
  );
}
