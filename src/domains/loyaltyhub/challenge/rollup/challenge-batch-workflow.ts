import * as clock from "../../../../kit/clock.js";
import { ChallengeBatchValidator, defaultChallengeBatchValidator } from "./challenge-batch-rules.js";
import { ChallengeBatchStore } from "./challenge-batch-store.js";

/** Moves challenge batches through their life cycle and keeps a journal of what it did. */
export class ChallengeBatchWorkflow {
  store: ChallengeBatchStore;
  validator: ChallengeBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ChallengeBatchStore,
    validator: ChallengeBatchValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newChallengeBatchWorkflow(store: ChallengeBatchStore, clockValue: clock.Clock): ChallengeBatchWorkflow {
  return new ChallengeBatchWorkflow(store, defaultChallengeBatchValidator(), clockValue, []);
}
