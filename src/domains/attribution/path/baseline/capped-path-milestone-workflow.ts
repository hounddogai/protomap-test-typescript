import * as clock from "../../../../kit/clock.js";
import { CappedPathMilestoneEngine, defaultCappedPathMilestoneEngine } from "./capped-path-milestone-engine.js";
import { CappedPathMilestoneValidator, defaultCappedPathMilestoneValidator } from "./capped-path-milestone-rules.js";
import { CappedPathMilestoneStore } from "./capped-path-milestone-store.js";

/** Moves capped path milestones through their life cycle and keeps a journal of what it did. */
export class CappedPathMilestoneManager {
  store: CappedPathMilestoneStore;
  validator: CappedPathMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedPathMilestoneEngine;

  constructor(
    store: CappedPathMilestoneStore,
    validator: CappedPathMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedPathMilestoneEngine,
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
      throw new Error(`capped path milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped path milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped path milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCappedPathMilestoneManager(store: CappedPathMilestoneStore, clockValue: clock.Clock): CappedPathMilestoneManager {
  return new CappedPathMilestoneManager(
    store,
    defaultCappedPathMilestoneValidator(),
    clockValue,
    [],
    defaultCappedPathMilestoneEngine(),
  );
}
