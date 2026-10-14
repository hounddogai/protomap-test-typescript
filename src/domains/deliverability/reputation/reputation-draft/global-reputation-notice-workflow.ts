import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalReputationNoticeEngine,
  defaultGlobalReputationNoticeEngine,
} from "./global-reputation-notice-engine.js";
import {
  GlobalReputationNoticeValidator,
  defaultGlobalReputationNoticeValidator,
} from "./global-reputation-notice-rules.js";
import { GlobalReputationNoticeStore } from "./global-reputation-notice-store.js";

/** Moves global reputation notices through their life cycle and keeps a journal of what it did. */
export class GlobalReputationNoticeDesk {
  store: GlobalReputationNoticeStore;
  validator: GlobalReputationNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalReputationNoticeEngine;

  constructor(
    store: GlobalReputationNoticeStore,
    validator: GlobalReputationNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalReputationNoticeEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reputation notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reputation notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reputation notice ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newGlobalReputationNoticeDesk(store: GlobalReputationNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalReputationNoticeDesk {
  return new GlobalReputationNoticeDesk(
    store,
    defaultGlobalReputationNoticeValidator(),
    clockValue,
    [],
    defaultGlobalReputationNoticeEngine(flagsValue),
  );
}
