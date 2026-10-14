import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultPacingSummaryEngine, defaultDefaultPacingSummaryEngine } from "./default-pacing-summary-engine.js";
import {
  DefaultPacingSummaryValidator,
  defaultDefaultPacingSummaryValidator,
} from "./default-pacing-summary-rules.js";
import { DefaultPacingSummaryStore } from "./default-pacing-summary-store.js";

/** Moves default pacing summaries through their life cycle and keeps a journal of what it did. */
export class DefaultPacingSummaryService {
  store: DefaultPacingSummaryStore;
  validator: DefaultPacingSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPacingSummaryEngine;

  constructor(
    store: DefaultPacingSummaryStore,
    validator: DefaultPacingSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPacingSummaryEngine,
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
      throw new Error(`default pacing summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default pacing summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default pacing summary ${code} not found`);
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

export function newDefaultPacingSummaryService(store: DefaultPacingSummaryStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultPacingSummaryService {
  return new DefaultPacingSummaryService(
    store,
    defaultDefaultPacingSummaryValidator(),
    clockValue,
    [],
    defaultDefaultPacingSummaryEngine(flagsValue),
  );
}
