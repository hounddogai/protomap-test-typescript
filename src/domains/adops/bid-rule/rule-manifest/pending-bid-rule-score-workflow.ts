import * as clock from "../../../../kit/clock.js";
import { PendingBidRuleScoreEngine, defaultPendingBidRuleScoreEngine } from "./pending-bid-rule-score-engine.js";
import { PendingBidRuleScoreValidator, defaultPendingBidRuleScoreValidator } from "./pending-bid-rule-score-rules.js";
import { PendingBidRuleScoreStore } from "./pending-bid-rule-score-store.js";

/** Moves pending bid rule scores through their life cycle and keeps a journal of what it did. */
export class PendingBidRuleScoreService {
  store: PendingBidRuleScoreStore;
  validator: PendingBidRuleScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBidRuleScoreEngine;

  constructor(
    store: PendingBidRuleScoreStore,
    validator: PendingBidRuleScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBidRuleScoreEngine,
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
      throw new Error(`pending bid rule score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending bid rule score ${code} not found`);
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
      throw new Error(`pending bid rule score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingBidRuleScoreService(store: PendingBidRuleScoreStore, clockValue: clock.Clock): PendingBidRuleScoreService {
  return new PendingBidRuleScoreService(
    store,
    defaultPendingBidRuleScoreValidator(),
    clockValue,
    [],
    defaultPendingBidRuleScoreEngine(),
  );
}
