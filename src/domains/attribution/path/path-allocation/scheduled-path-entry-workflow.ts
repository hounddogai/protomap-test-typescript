import * as clock from "../../../../kit/clock.js";
import { ScheduledPathEntryEngine, defaultScheduledPathEntryEngine } from "./scheduled-path-entry-engine.js";
import { ScheduledPathEntryValidator, defaultScheduledPathEntryValidator } from "./scheduled-path-entry-rules.js";
import { ScheduledPathEntryStore } from "./scheduled-path-entry-store.js";

/** Moves scheduled path entries through their life cycle and keeps a journal of what it did. */
export class ScheduledPathEntryCoordinator {
  store: ScheduledPathEntryStore;
  validator: ScheduledPathEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledPathEntryEngine;

  constructor(
    store: ScheduledPathEntryStore,
    validator: ScheduledPathEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledPathEntryEngine,
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
      throw new Error(`scheduled path entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled path entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled path entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledPathEntryCoordinator(store: ScheduledPathEntryStore, clockValue: clock.Clock): ScheduledPathEntryCoordinator {
  return new ScheduledPathEntryCoordinator(
    store,
    defaultScheduledPathEntryValidator(),
    clockValue,
    [],
    defaultScheduledPathEntryEngine(),
  );
}
