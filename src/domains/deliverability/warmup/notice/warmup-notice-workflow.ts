import * as clock from "../../../../kit/clock.js";
import { WarmupNoticeValidator, defaultWarmupNoticeValidator } from "./warmup-notice-rules.js";
import { WarmupNoticeStore } from "./warmup-notice-store.js";

/** Moves warmup notices through their life cycle and keeps a journal of what it did. */
export class WarmupNoticeDesk {
  store: WarmupNoticeStore;
  validator: WarmupNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WarmupNoticeStore,
    validator: WarmupNoticeValidator,
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
      throw new Error(`warmup notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newWarmupNoticeDesk(store: WarmupNoticeStore, clockValue: clock.Clock): WarmupNoticeDesk {
  return new WarmupNoticeDesk(store, defaultWarmupNoticeValidator(), clockValue, []);
}
