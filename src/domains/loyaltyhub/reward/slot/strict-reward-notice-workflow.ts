import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictRewardNoticeEngine, defaultStrictRewardNoticeEngine } from "./strict-reward-notice-engine.js";
import { StrictRewardNoticeValidator, defaultStrictRewardNoticeValidator } from "./strict-reward-notice-rules.js";
import { StrictRewardNoticeStore } from "./strict-reward-notice-store.js";

/** Moves strict reward notices through their life cycle and keeps a journal of what it did. */
export class StrictRewardNoticeDesk {
  store: StrictRewardNoticeStore;
  validator: StrictRewardNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictRewardNoticeEngine;

  constructor(
    store: StrictRewardNoticeStore,
    validator: StrictRewardNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictRewardNoticeEngine,
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
      throw new Error(`strict reward notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reward notice ${code} not found`);
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

export function newStrictRewardNoticeDesk(store: StrictRewardNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictRewardNoticeDesk {
  return new StrictRewardNoticeDesk(
    store,
    defaultStrictRewardNoticeValidator(),
    clockValue,
    [],
    defaultStrictRewardNoticeEngine(flagsValue),
  );
}
