import * as clock from "../../../../kit/clock.js";
import { LenientBounceNoticeValidator, defaultLenientBounceNoticeValidator } from "./lenient-bounce-notice-rules.js";
import { LenientBounceNoticeStore } from "./lenient-bounce-notice-store.js";

/** Moves lenient bounce notices through their life cycle and keeps a journal of what it did. */
export class LenientBounceNoticeWorkflow {
  store: LenientBounceNoticeStore;
  validator: LenientBounceNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientBounceNoticeStore,
    validator: LenientBounceNoticeValidator,
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
      throw new Error(`lenient bounce notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient bounce notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newLenientBounceNoticeWorkflow(store: LenientBounceNoticeStore, clockValue: clock.Clock): LenientBounceNoticeWorkflow {
  return new LenientBounceNoticeWorkflow(store, defaultLenientBounceNoticeValidator(), clockValue, []);
}
