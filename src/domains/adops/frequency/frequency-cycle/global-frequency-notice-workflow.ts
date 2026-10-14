import * as clock from "../../../../kit/clock.js";
import {
  GlobalFrequencyNoticeValidator,
  defaultGlobalFrequencyNoticeValidator,
} from "./global-frequency-notice-rules.js";
import { GlobalFrequencyNoticeStore } from "./global-frequency-notice-store.js";

/** Moves global frequency notices through their life cycle and keeps a journal of what it did. */
export class GlobalFrequencyNoticeWorkflow {
  store: GlobalFrequencyNoticeStore;
  validator: GlobalFrequencyNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalFrequencyNoticeStore,
    validator: GlobalFrequencyNoticeValidator,
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
      throw new Error(`global frequency notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global frequency notice ${code} not found`);
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

export function newGlobalFrequencyNoticeWorkflow(store: GlobalFrequencyNoticeStore, clockValue: clock.Clock): GlobalFrequencyNoticeWorkflow {
  return new GlobalFrequencyNoticeWorkflow(store, defaultGlobalFrequencyNoticeValidator(), clockValue, []);
}
