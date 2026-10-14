import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutOverrideEngine, defaultOptOutOverrideEngine } from "./opt-out-override-engine.js";
import { OptOutOverrideValidator, defaultOptOutOverrideValidator } from "./opt-out-override-rules.js";
import { OptOutOverrideStore } from "./opt-out-override-store.js";

/** Moves opt out overrides through their life cycle and keeps a journal of what it did. */
export class OptOutOverrideManager {
  store: OptOutOverrideStore;
  validator: OptOutOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutOverrideEngine;

  constructor(
    store: OptOutOverrideStore,
    validator: OptOutOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutOverrideEngine,
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
      throw new Error(`opt out override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out override ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newOptOutOverrideManager(store: OptOutOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutOverrideManager {
  return new OptOutOverrideManager(
    store,
    defaultOptOutOverrideValidator(),
    clockValue,
    [],
    defaultOptOutOverrideEngine(flagsValue),
  );
}
