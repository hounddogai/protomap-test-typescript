import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BadgeEntryEngine, defaultBadgeEntryEngine } from "./badge-entry-engine.js";
import { BadgeEntryValidator, defaultBadgeEntryValidator } from "./badge-entry-rules.js";
import { BadgeEntryStore } from "./badge-entry-store.js";

/** Moves badge entries through their life cycle and keeps a journal of what it did. */
export class BadgeEntryCoordinator {
  store: BadgeEntryStore;
  validator: BadgeEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeEntryEngine;

  constructor(
    store: BadgeEntryStore,
    validator: BadgeEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeEntryEngine,
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
      throw new Error(`badge entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge entry ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBadgeEntryCoordinator(store: BadgeEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BadgeEntryCoordinator {
  return new BadgeEntryCoordinator(
    store,
    defaultBadgeEntryValidator(),
    clockValue,
    [],
    defaultBadgeEntryEngine(flagsValue),
  );
}
