import * as clock from "../../../../kit/clock.js";
import { InsightProfileEngine, defaultInsightProfileEngine } from "./insight-profile-engine.js";
import { InsightProfileValidator, defaultInsightProfileValidator } from "./insight-profile-rules.js";
import { InsightProfileStore } from "./insight-profile-store.js";

/** Moves insight profiles through their life cycle and keeps a journal of what it did. */
export class InsightProfileCoordinator {
  store: InsightProfileStore;
  validator: InsightProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightProfileEngine;

  constructor(
    store: InsightProfileStore,
    validator: InsightProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightProfileEngine,
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
      throw new Error(`insight profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight profile ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInsightProfileCoordinator(store: InsightProfileStore, clockValue: clock.Clock): InsightProfileCoordinator {
  return new InsightProfileCoordinator(
    store,
    defaultInsightProfileValidator(),
    clockValue,
    [],
    defaultInsightProfileEngine(),
  );
}
