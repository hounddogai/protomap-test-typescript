import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleNoticeEngine, defaultExitRuleNoticeEngine } from "./exit-rule-notice-engine.js";
import { ExitRuleNoticeValidator, defaultExitRuleNoticeValidator } from "./exit-rule-notice-rules.js";
import { ExitRuleNoticeStore } from "./exit-rule-notice-store.js";

/** Moves exit rule notices through their life cycle and keeps a journal of what it did. */
export class ExitRuleNoticeDesk {
  store: ExitRuleNoticeStore;
  validator: ExitRuleNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleNoticeEngine;

  constructor(
    store: ExitRuleNoticeStore,
    validator: ExitRuleNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleNoticeEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule notice ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newExitRuleNoticeDesk(store: ExitRuleNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleNoticeDesk {
  return new ExitRuleNoticeDesk(
    store,
    defaultExitRuleNoticeValidator(),
    clockValue,
    [],
    defaultExitRuleNoticeEngine(flagsValue),
  );
}
