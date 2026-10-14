import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionOverrideEngine, defaultRetentionOverrideEngine } from "./retention-override-engine.js";
import { RetentionOverrideValidator, defaultRetentionOverrideValidator } from "./retention-override-rules.js";
import { RetentionOverrideStore } from "./retention-override-store.js";

/** Moves retention overrides through their life cycle and keeps a journal of what it did. */
export class RetentionOverrideCoordinator {
  store: RetentionOverrideStore;
  validator: RetentionOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionOverrideEngine;

  constructor(
    store: RetentionOverrideStore,
    validator: RetentionOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionOverrideEngine,
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
      throw new Error(`retention override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRetentionOverrideCoordinator(store: RetentionOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionOverrideCoordinator {
  return new RetentionOverrideCoordinator(
    store,
    defaultRetentionOverrideValidator(),
    clockValue,
    [],
    defaultRetentionOverrideEngine(flagsValue),
  );
}
