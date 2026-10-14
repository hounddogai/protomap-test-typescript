import * as clock from "../../../../kit/clock.js";
import { GlobalMentionRollupEngine, defaultGlobalMentionRollupEngine } from "./global-mention-rollup-engine.js";
import { GlobalMentionRollupValidator, defaultGlobalMentionRollupValidator } from "./global-mention-rollup-rules.js";
import { GlobalMentionRollupStore } from "./global-mention-rollup-store.js";

/** Moves global mention rollups through their life cycle and keeps a journal of what it did. */
export class GlobalMentionRollupService {
  store: GlobalMentionRollupStore;
  validator: GlobalMentionRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalMentionRollupEngine;

  constructor(
    store: GlobalMentionRollupStore,
    validator: GlobalMentionRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalMentionRollupEngine,
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
      throw new Error(`global mention rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global mention rollup ${code} not found`);
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
      throw new Error(`global mention rollup ${code} not found`);
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

export function newGlobalMentionRollupService(store: GlobalMentionRollupStore, clockValue: clock.Clock): GlobalMentionRollupService {
  return new GlobalMentionRollupService(
    store,
    defaultGlobalMentionRollupValidator(),
    clockValue,
    [],
    defaultGlobalMentionRollupEngine(),
  );
}
