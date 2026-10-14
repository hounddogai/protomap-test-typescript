import * as clock from "../../../../kit/clock.js";
import { LenientLevelDraftValidator, defaultLenientLevelDraftValidator } from "./lenient-level-draft-rules.js";
import { LenientLevelDraftStore } from "./lenient-level-draft-store.js";

/** Moves lenient level drafts through their life cycle and keeps a journal of what it did. */
export class LenientLevelDraftDesk {
  store: LenientLevelDraftStore;
  validator: LenientLevelDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientLevelDraftStore,
    validator: LenientLevelDraftValidator,
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
      throw new Error(`lenient level draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient level draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newLenientLevelDraftDesk(store: LenientLevelDraftStore, clockValue: clock.Clock): LenientLevelDraftDesk {
  return new LenientLevelDraftDesk(store, defaultLenientLevelDraftValidator(), clockValue, []);
}
