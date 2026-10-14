import * as clock from "../../../../kit/clock.js";
import { PostSummaryValidator, defaultPostSummaryValidator } from "./post-summary-rules.js";
import { PostSummaryStore } from "./post-summary-store.js";

/** Moves post summaries through their life cycle and keeps a journal of what it did. */
export class PostSummaryService {
  store: PostSummaryStore;
  validator: PostSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PostSummaryStore,
    validator: PostSummaryValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post summary ${code} not found`);
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

export function newPostSummaryService(store: PostSummaryStore, clockValue: clock.Clock): PostSummaryService {
  return new PostSummaryService(store, defaultPostSummaryValidator(), clockValue, []);
}
