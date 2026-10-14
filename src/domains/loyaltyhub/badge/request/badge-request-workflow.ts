import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BadgeRequestEngine, defaultBadgeRequestEngine } from "./badge-request-engine.js";
import { BadgeRequestValidator, defaultBadgeRequestValidator } from "./badge-request-rules.js";
import { BadgeRequestStore } from "./badge-request-store.js";

/** Moves badge requests through their life cycle and keeps a journal of what it did. */
export class BadgeRequestWorkflow {
  store: BadgeRequestStore;
  validator: BadgeRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeRequestEngine;

  constructor(
    store: BadgeRequestStore,
    validator: BadgeRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeRequestEngine,
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
      throw new Error(`badge request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge request ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newBadgeRequestWorkflow(store: BadgeRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): BadgeRequestWorkflow {
  return new BadgeRequestWorkflow(
    store,
    defaultBadgeRequestValidator(),
    clockValue,
    [],
    defaultBadgeRequestEngine(flagsValue),
  );
}
