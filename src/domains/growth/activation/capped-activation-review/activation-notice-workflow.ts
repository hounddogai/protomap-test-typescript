import * as clock from "../../../../kit/clock.js";
import { ActivationNoticeValidator, defaultActivationNoticeValidator } from "./activation-notice-rules.js";
import { ActivationNoticeStore } from "./activation-notice-store.js";

/** Moves activation notices through their life cycle and keeps a journal of what it did. */
export class ActivationNoticeService {
  store: ActivationNoticeStore;
  validator: ActivationNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ActivationNoticeStore,
    validator: ActivationNoticeValidator,
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
      throw new Error(`activation notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newActivationNoticeService(store: ActivationNoticeStore, clockValue: clock.Clock): ActivationNoticeService {
  return new ActivationNoticeService(store, defaultActivationNoticeValidator(), clockValue, []);
}
