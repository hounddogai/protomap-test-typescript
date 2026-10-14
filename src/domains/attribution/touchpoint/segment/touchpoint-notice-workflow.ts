import * as clock from "../../../../kit/clock.js";
import { TouchpointNoticeValidator, defaultTouchpointNoticeValidator } from "./touchpoint-notice-rules.js";
import { TouchpointNoticeStore } from "./touchpoint-notice-store.js";

/** Moves touchpoint notices through their life cycle and keeps a journal of what it did. */
export class TouchpointNoticeManager {
  store: TouchpointNoticeStore;
  validator: TouchpointNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TouchpointNoticeStore,
    validator: TouchpointNoticeValidator,
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
      throw new Error(`touchpoint notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint notice ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTouchpointNoticeManager(store: TouchpointNoticeStore, clockValue: clock.Clock): TouchpointNoticeManager {
  return new TouchpointNoticeManager(store, defaultTouchpointNoticeValidator(), clockValue, []);
}
