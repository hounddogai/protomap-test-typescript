import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultSenderGroupEngine, defaultDefaultSenderGroupEngine } from "./default-sender-group-engine.js";
import { DefaultSenderGroupValidator, defaultDefaultSenderGroupValidator } from "./default-sender-group-rules.js";
import { DefaultSenderGroupStore } from "./default-sender-group-store.js";

/** Moves default sender groups through their life cycle and keeps a journal of what it did. */
export class DefaultSenderGroupManager {
  store: DefaultSenderGroupStore;
  validator: DefaultSenderGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultSenderGroupEngine;

  constructor(
    store: DefaultSenderGroupStore,
    validator: DefaultSenderGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultSenderGroupEngine,
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
      throw new Error(`default sender group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default sender group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default sender group ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultSenderGroupManager(store: DefaultSenderGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultSenderGroupManager {
  return new DefaultSenderGroupManager(
    store,
    defaultDefaultSenderGroupValidator(),
    clockValue,
    [],
    defaultDefaultSenderGroupEngine(flagsValue),
  );
}
