import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleRecordEngine, defaultExitRuleRecordEngine } from "./exit-rule-record-engine.js";
import { ExitRuleRecordValidator, defaultExitRuleRecordValidator } from "./exit-rule-record-rules.js";
import { ExitRuleRecordStore } from "./exit-rule-record-store.js";

/** Moves exit rule records through their life cycle and keeps a journal of what it did. */
export class ExitRuleRecordService {
  store: ExitRuleRecordStore;
  validator: ExitRuleRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleRecordEngine;

  constructor(
    store: ExitRuleRecordStore,
    validator: ExitRuleRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleRecordEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule record ${code} not found`);
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

export function newExitRuleRecordService(store: ExitRuleRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleRecordService {
  return new ExitRuleRecordService(
    store,
    defaultExitRuleRecordValidator(),
    clockValue,
    [],
    defaultExitRuleRecordEngine(flagsValue),
  );
}
