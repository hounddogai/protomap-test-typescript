import * as clock from "../../../../kit/clock.js";
import { PacingNoticeValidator, defaultPacingNoticeValidator } from "./pacing-notice-rules.js";
import { PacingNoticeStore } from "./pacing-notice-store.js";

/** Moves pacing notices through their life cycle and keeps a journal of what it did. */
export class PacingNoticeService {
  store: PacingNoticeStore;
  validator: PacingNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PacingNoticeStore,
    validator: PacingNoticeValidator,
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
      throw new Error(`pacing notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing notice ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPacingNoticeService(store: PacingNoticeStore, clockValue: clock.Clock): PacingNoticeService {
  return new PacingNoticeService(store, defaultPacingNoticeValidator(), clockValue, []);
}
