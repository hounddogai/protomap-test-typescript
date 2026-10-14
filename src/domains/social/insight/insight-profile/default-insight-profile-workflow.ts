import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultInsightProfileEngine, defaultDefaultInsightProfileEngine } from "./default-insight-profile-engine.js";
import {
  DefaultInsightProfileValidator,
  defaultDefaultInsightProfileValidator,
} from "./default-insight-profile-rules.js";
import { DefaultInsightProfileStore } from "./default-insight-profile-store.js";

/** Moves default insight profiles through their life cycle and keeps a journal of what it did. */
export class DefaultInsightProfileWorkflow {
  store: DefaultInsightProfileStore;
  validator: DefaultInsightProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultInsightProfileEngine;

  constructor(
    store: DefaultInsightProfileStore,
    validator: DefaultInsightProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultInsightProfileEngine,
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
      throw new Error(`default insight profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default insight profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default insight profile ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newDefaultInsightProfileWorkflow(store: DefaultInsightProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultInsightProfileWorkflow {
  return new DefaultInsightProfileWorkflow(
    store,
    defaultDefaultInsightProfileValidator(),
    clockValue,
    [],
    defaultDefaultInsightProfileEngine(flagsValue),
  );
}
