import * as clock from "../../../../kit/clock.js";
import { CappedBounceTierValidator, defaultCappedBounceTierValidator } from "./capped-bounce-tier-rules.js";
import { CappedBounceTierStore } from "./capped-bounce-tier-store.js";

/** Moves capped bounce tiers through their life cycle and keeps a journal of what it did. */
export class CappedBounceTierWorkflow {
  store: CappedBounceTierStore;
  validator: CappedBounceTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedBounceTierStore,
    validator: CappedBounceTierValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped bounce tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped bounce tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newCappedBounceTierWorkflow(store: CappedBounceTierStore, clockValue: clock.Clock): CappedBounceTierWorkflow {
  return new CappedBounceTierWorkflow(store, defaultCappedBounceTierValidator(), clockValue, []);
}
