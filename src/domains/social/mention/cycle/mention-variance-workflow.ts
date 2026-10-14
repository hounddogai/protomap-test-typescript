import * as clock from "../../../../kit/clock.js";
import { MentionVarianceEngine, defaultMentionVarianceEngine } from "./mention-variance-engine.js";
import { MentionVarianceValidator, defaultMentionVarianceValidator } from "./mention-variance-rules.js";
import { MentionVarianceStore } from "./mention-variance-store.js";

/** Moves mention variances through their life cycle and keeps a journal of what it did. */
export class MentionVarianceWorkflow {
  store: MentionVarianceStore;
  validator: MentionVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionVarianceEngine;

  constructor(
    store: MentionVarianceStore,
    validator: MentionVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionVarianceEngine,
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
      throw new Error(`mention variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newMentionVarianceWorkflow(store: MentionVarianceStore, clockValue: clock.Clock): MentionVarianceWorkflow {
  return new MentionVarianceWorkflow(
    store,
    defaultMentionVarianceValidator(),
    clockValue,
    [],
    defaultMentionVarianceEngine(),
  );
}
