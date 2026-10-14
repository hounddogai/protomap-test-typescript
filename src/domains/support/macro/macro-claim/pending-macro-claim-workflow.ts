import * as clock from "../../../../kit/clock.js";
import { PendingMacroClaimEngine, defaultPendingMacroClaimEngine } from "./pending-macro-claim-engine.js";
import { PendingMacroClaimValidator, defaultPendingMacroClaimValidator } from "./pending-macro-claim-rules.js";
import { PendingMacroClaimStore } from "./pending-macro-claim-store.js";

/** Moves pending macro claims through their life cycle and keeps a journal of what it did. */
export class PendingMacroClaimWorkflow {
  store: PendingMacroClaimStore;
  validator: PendingMacroClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingMacroClaimEngine;

  constructor(
    store: PendingMacroClaimStore,
    validator: PendingMacroClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingMacroClaimEngine,
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
      throw new Error(`pending macro claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending macro claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending macro claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPendingMacroClaimWorkflow(store: PendingMacroClaimStore, clockValue: clock.Clock): PendingMacroClaimWorkflow {
  return new PendingMacroClaimWorkflow(
    store,
    defaultPendingMacroClaimValidator(),
    clockValue,
    [],
    defaultPendingMacroClaimEngine(),
  );
}
