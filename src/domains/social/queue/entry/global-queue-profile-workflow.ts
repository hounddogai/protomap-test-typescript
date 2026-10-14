import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalQueueProfileEngine, defaultGlobalQueueProfileEngine } from "./global-queue-profile-engine.js";
import { GlobalQueueProfileValidator, defaultGlobalQueueProfileValidator } from "./global-queue-profile-rules.js";
import { GlobalQueueProfileStore } from "./global-queue-profile-store.js";

/** Moves global queue profiles through their life cycle and keeps a journal of what it did. */
export class GlobalQueueProfileWorkflow {
  store: GlobalQueueProfileStore;
  validator: GlobalQueueProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalQueueProfileEngine;

  constructor(
    store: GlobalQueueProfileStore,
    validator: GlobalQueueProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalQueueProfileEngine,
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
      throw new Error(`global queue profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global queue profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global queue profile ${code} not found`);
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

export function newGlobalQueueProfileWorkflow(store: GlobalQueueProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalQueueProfileWorkflow {
  return new GlobalQueueProfileWorkflow(
    store,
    defaultGlobalQueueProfileValidator(),
    clockValue,
    [],
    defaultGlobalQueueProfileEngine(flagsValue),
  );
}
