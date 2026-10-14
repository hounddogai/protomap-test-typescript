import * as clock from "../../../../kit/clock.js";
import { BadgeExceptionEngine, defaultBadgeExceptionEngine } from "./badge-exception-engine.js";
import { BadgeExceptionValidator, defaultBadgeExceptionValidator } from "./badge-exception-rules.js";
import { BadgeExceptionStore } from "./badge-exception-store.js";

/** Moves badge exceptions through their life cycle and keeps a journal of what it did. */
export class BadgeExceptionService {
  store: BadgeExceptionStore;
  validator: BadgeExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeExceptionEngine;

  constructor(
    store: BadgeExceptionStore,
    validator: BadgeExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeExceptionEngine,
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
      throw new Error(`badge exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newBadgeExceptionService(store: BadgeExceptionStore, clockValue: clock.Clock): BadgeExceptionService {
  return new BadgeExceptionService(
    store,
    defaultBadgeExceptionValidator(),
    clockValue,
    [],
    defaultBadgeExceptionEngine(),
  );
}
