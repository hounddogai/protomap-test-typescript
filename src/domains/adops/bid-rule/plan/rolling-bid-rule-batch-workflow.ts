import * as clock from "../../../../kit/clock.js";
import { RollingBidRuleBatchValidator, defaultRollingBidRuleBatchValidator } from "./rolling-bid-rule-batch-rules.js";
import { RollingBidRuleBatchStore } from "./rolling-bid-rule-batch-store.js";

/** Moves rolling bid rule batches through their life cycle and keeps a journal of what it did. */
export class RollingBidRuleBatchService {
  store: RollingBidRuleBatchStore;
  validator: RollingBidRuleBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingBidRuleBatchStore,
    validator: RollingBidRuleBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling bid rule batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling bid rule batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newRollingBidRuleBatchService(store: RollingBidRuleBatchStore, clockValue: clock.Clock): RollingBidRuleBatchService {
  return new RollingBidRuleBatchService(store, defaultRollingBidRuleBatchValidator(), clockValue, []);
}
