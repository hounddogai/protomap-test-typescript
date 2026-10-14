import * as clock from "../../../../kit/clock.js";
import { ReplyScoreValidator, defaultReplyScoreValidator } from "./reply-score-rules.js";
import { ReplyScoreStore } from "./reply-score-store.js";

/** Moves reply scores through their life cycle and keeps a journal of what it did. */
export class ReplyScoreService {
  store: ReplyScoreStore;
  validator: ReplyScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: ReplyScoreStore, validator: ReplyScoreValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`reply score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newReplyScoreService(store: ReplyScoreStore, clockValue: clock.Clock): ReplyScoreService {
  return new ReplyScoreService(store, defaultReplyScoreValidator(), clockValue, []);
}
