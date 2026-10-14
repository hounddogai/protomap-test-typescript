import * as clock from "../../../../kit/clock.js";
import {
  GlobalTouchpointNoticeEngine,
  defaultGlobalTouchpointNoticeEngine,
} from "./global-touchpoint-notice-engine.js";
import {
  GlobalTouchpointNoticeValidator,
  defaultGlobalTouchpointNoticeValidator,
} from "./global-touchpoint-notice-rules.js";
import { GlobalTouchpointNoticeStore } from "./global-touchpoint-notice-store.js";

/** Moves global touchpoint notices through their life cycle and keeps a journal of what it did. */
export class GlobalTouchpointNoticeService {
  store: GlobalTouchpointNoticeStore;
  validator: GlobalTouchpointNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalTouchpointNoticeEngine;

  constructor(
    store: GlobalTouchpointNoticeStore,
    validator: GlobalTouchpointNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalTouchpointNoticeEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global touchpoint notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global touchpoint notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global touchpoint notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newGlobalTouchpointNoticeService(store: GlobalTouchpointNoticeStore, clockValue: clock.Clock): GlobalTouchpointNoticeService {
  return new GlobalTouchpointNoticeService(
    store,
    defaultGlobalTouchpointNoticeValidator(),
    clockValue,
    [],
    defaultGlobalTouchpointNoticeEngine(),
  );
}
