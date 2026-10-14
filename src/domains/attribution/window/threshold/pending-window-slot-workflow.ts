import * as clock from "../../../../kit/clock.js";
import { PendingWindowSlotEngine, defaultPendingWindowSlotEngine } from "./pending-window-slot-engine.js";
import { PendingWindowSlotValidator, defaultPendingWindowSlotValidator } from "./pending-window-slot-rules.js";
import { PendingWindowSlotStore } from "./pending-window-slot-store.js";

/** Moves pending window slots through their life cycle and keeps a journal of what it did. */
export class PendingWindowSlotWorkflow {
  store: PendingWindowSlotStore;
  validator: PendingWindowSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingWindowSlotEngine;

  constructor(
    store: PendingWindowSlotStore,
    validator: PendingWindowSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingWindowSlotEngine,
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
      throw new Error(`pending window slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending window slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending window slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPendingWindowSlotWorkflow(store: PendingWindowSlotStore, clockValue: clock.Clock): PendingWindowSlotWorkflow {
  return new PendingWindowSlotWorkflow(
    store,
    defaultPendingWindowSlotValidator(),
    clockValue,
    [],
    defaultPendingWindowSlotEngine(),
  );
}
