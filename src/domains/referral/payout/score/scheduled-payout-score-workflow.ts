import * as clock from "../../../../kit/clock.js";
import { ScheduledPayoutScoreEngine, defaultScheduledPayoutScoreEngine } from "./scheduled-payout-score-engine.js";
import {
  ScheduledPayoutScoreValidator,
  defaultScheduledPayoutScoreValidator,
} from "./scheduled-payout-score-rules.js";
import { ScheduledPayoutScoreStore } from "./scheduled-payout-score-store.js";

/** Moves scheduled payout scores through their life cycle and keeps a journal of what it did. */
export class ScheduledPayoutScoreService {
  store: ScheduledPayoutScoreStore;
  validator: ScheduledPayoutScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledPayoutScoreEngine;

  constructor(
    store: ScheduledPayoutScoreStore,
    validator: ScheduledPayoutScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledPayoutScoreEngine,
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
      throw new Error(`scheduled payout score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled payout score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled payout score ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newScheduledPayoutScoreService(store: ScheduledPayoutScoreStore, clockValue: clock.Clock): ScheduledPayoutScoreService {
  return new ScheduledPayoutScoreService(
    store,
    defaultScheduledPayoutScoreValidator(),
    clockValue,
    [],
    defaultScheduledPayoutScoreEngine(),
  );
}
