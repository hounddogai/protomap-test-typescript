import * as clock from "../../../../kit/clock.js";
import { AdaptiveLevelNoticeValidator, defaultAdaptiveLevelNoticeValidator } from "./adaptive-level-notice-rules.js";
import { AdaptiveLevelNoticeStore } from "./adaptive-level-notice-store.js";

/** Moves adaptive level notices through their life cycle and keeps a journal of what it did. */
export class AdaptiveLevelNoticeManager {
  store: AdaptiveLevelNoticeStore;
  validator: AdaptiveLevelNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveLevelNoticeStore,
    validator: AdaptiveLevelNoticeValidator,
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
      throw new Error(`adaptive level notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive level notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newAdaptiveLevelNoticeManager(store: AdaptiveLevelNoticeStore, clockValue: clock.Clock): AdaptiveLevelNoticeManager {
  return new AdaptiveLevelNoticeManager(store, defaultAdaptiveLevelNoticeValidator(), clockValue, []);
}
