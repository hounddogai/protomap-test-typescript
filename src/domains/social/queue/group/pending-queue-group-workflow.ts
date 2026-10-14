import * as clock from "../../../../kit/clock.js";
import { PendingQueueGroupEngine, defaultPendingQueueGroupEngine } from "./pending-queue-group-engine.js";
import { PendingQueueGroupValidator, defaultPendingQueueGroupValidator } from "./pending-queue-group-rules.js";
import { PendingQueueGroupStore } from "./pending-queue-group-store.js";

/** Moves pending queue groups through their life cycle and keeps a journal of what it did. */
export class PendingQueueGroupCoordinator {
  store: PendingQueueGroupStore;
  validator: PendingQueueGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingQueueGroupEngine;

  constructor(
    store: PendingQueueGroupStore,
    validator: PendingQueueGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingQueueGroupEngine,
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
      throw new Error(`pending queue group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending queue group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending queue group ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPendingQueueGroupCoordinator(store: PendingQueueGroupStore, clockValue: clock.Clock): PendingQueueGroupCoordinator {
  return new PendingQueueGroupCoordinator(
    store,
    defaultPendingQueueGroupValidator(),
    clockValue,
    [],
    defaultPendingQueueGroupEngine(),
  );
}
