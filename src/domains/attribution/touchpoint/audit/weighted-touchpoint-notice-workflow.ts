import * as clock from "../../../../kit/clock.js";
import {
  WeightedTouchpointNoticeValidator,
  defaultWeightedTouchpointNoticeValidator,
} from "./weighted-touchpoint-notice-rules.js";
import { WeightedTouchpointNoticeStore } from "./weighted-touchpoint-notice-store.js";

/** Moves weighted touchpoint notices through their life cycle and keeps a journal of what it did. */
export class WeightedTouchpointNoticeService {
  store: WeightedTouchpointNoticeStore;
  validator: WeightedTouchpointNoticeValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedTouchpointNoticeStore,
    validator: WeightedTouchpointNoticeValidator,
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
      throw new Error(`weighted touchpoint notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted touchpoint notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newWeightedTouchpointNoticeService(store: WeightedTouchpointNoticeStore, clockValue: clock.Clock): WeightedTouchpointNoticeService {
  return new WeightedTouchpointNoticeService(store, defaultWeightedTouchpointNoticeValidator(), clockValue, []);
}
