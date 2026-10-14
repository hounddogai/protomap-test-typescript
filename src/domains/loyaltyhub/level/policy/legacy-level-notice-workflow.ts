import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyLevelNoticeEngine, defaultLegacyLevelNoticeEngine } from "./legacy-level-notice-engine.js";
import { LegacyLevelNoticeValidator, defaultLegacyLevelNoticeValidator } from "./legacy-level-notice-rules.js";
import { LegacyLevelNoticeStore } from "./legacy-level-notice-store.js";

/** Moves legacy level notices through their life cycle and keeps a journal of what it did. */
export class LegacyLevelNoticeWorkflow {
  store: LegacyLevelNoticeStore;
  validator: LegacyLevelNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyLevelNoticeEngine;

  constructor(
    store: LegacyLevelNoticeStore,
    validator: LegacyLevelNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyLevelNoticeEngine,
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
      throw new Error(`legacy level notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy level notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy level notice ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyLevelNoticeWorkflow(store: LegacyLevelNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyLevelNoticeWorkflow {
  return new LegacyLevelNoticeWorkflow(
    store,
    defaultLegacyLevelNoticeValidator(),
    clockValue,
    [],
    defaultLegacyLevelNoticeEngine(flagsValue),
  );
}
