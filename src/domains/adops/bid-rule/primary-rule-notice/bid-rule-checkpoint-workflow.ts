import * as clock from "../../../../kit/clock.js";
import { BidRuleCheckpointEngine, defaultBidRuleCheckpointEngine } from "./bid-rule-checkpoint-engine.js";
import { BidRuleCheckpointValidator, defaultBidRuleCheckpointValidator } from "./bid-rule-checkpoint-rules.js";
import { BidRuleCheckpointStore } from "./bid-rule-checkpoint-store.js";

/** Moves bid rule checkpoints through their life cycle and keeps a journal of what it did. */
export class BidRuleCheckpointManager {
  store: BidRuleCheckpointStore;
  validator: BidRuleCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BidRuleCheckpointEngine;

  constructor(
    store: BidRuleCheckpointStore,
    validator: BidRuleCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BidRuleCheckpointEngine,
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
      throw new Error(`bid rule checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bid rule checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newBidRuleCheckpointManager(store: BidRuleCheckpointStore, clockValue: clock.Clock): BidRuleCheckpointManager {
  return new BidRuleCheckpointManager(
    store,
    defaultBidRuleCheckpointValidator(),
    clockValue,
    [],
    defaultBidRuleCheckpointEngine(),
  );
}
