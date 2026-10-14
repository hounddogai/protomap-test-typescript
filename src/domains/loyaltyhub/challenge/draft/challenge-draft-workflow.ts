import * as clock from "../../../../kit/clock.js";
import { ChallengeDraftEngine, defaultChallengeDraftEngine } from "./challenge-draft-engine.js";
import { ChallengeDraftValidator, defaultChallengeDraftValidator } from "./challenge-draft-rules.js";
import { ChallengeDraftStore } from "./challenge-draft-store.js";

/** Moves challenge drafts through their life cycle and keeps a journal of what it did. */
export class ChallengeDraftManager {
  store: ChallengeDraftStore;
  validator: ChallengeDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeDraftEngine;

  constructor(
    store: ChallengeDraftStore,
    validator: ChallengeDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeDraftEngine,
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
      throw new Error(`challenge draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge draft ${code} not found`);
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
      throw new Error(`challenge draft ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newChallengeDraftManager(store: ChallengeDraftStore, clockValue: clock.Clock): ChallengeDraftManager {
  return new ChallengeDraftManager(
    store,
    defaultChallengeDraftValidator(),
    clockValue,
    [],
    defaultChallengeDraftEngine(),
  );
}
