import * as clock from "../../../../kit/clock.js";
import { RetentionTierEngine, defaultRetentionTierEngine } from "./retention-tier-engine.js";
import { RetentionTierValidator, defaultRetentionTierValidator } from "./retention-tier-rules.js";
import { RetentionTierStore } from "./retention-tier-store.js";

/** Moves retention tiers through their life cycle and keeps a journal of what it did. */
export class RetentionTierWorkflow {
  store: RetentionTierStore;
  validator: RetentionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionTierEngine;

  constructor(
    store: RetentionTierStore,
    validator: RetentionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionTierEngine,
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
      throw new Error(`retention tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention tier ${code} not found`);
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
      throw new Error(`retention tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionTierWorkflow(store: RetentionTierStore, clockValue: clock.Clock): RetentionTierWorkflow {
  return new RetentionTierWorkflow(
    store,
    defaultRetentionTierValidator(),
    clockValue,
    [],
    defaultRetentionTierEngine(),
  );
}
