import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalOptOutExceptionEngine,
  defaultGlobalOptOutExceptionEngine,
} from "./global-opt-out-exception-engine.js";
import {
  GlobalOptOutExceptionValidator,
  defaultGlobalOptOutExceptionValidator,
} from "./global-opt-out-exception-rules.js";
import { GlobalOptOutExceptionStore } from "./global-opt-out-exception-store.js";

/** Moves global opt out exceptions through their life cycle and keeps a journal of what it did. */
export class GlobalOptOutExceptionCoordinator {
  store: GlobalOptOutExceptionStore;
  validator: GlobalOptOutExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalOptOutExceptionEngine;

  constructor(
    store: GlobalOptOutExceptionStore,
    validator: GlobalOptOutExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalOptOutExceptionEngine,
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
      throw new Error(`global opt out exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global opt out exception ${code} not found`);
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
      throw new Error(`global opt out exception ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newGlobalOptOutExceptionCoordinator(store: GlobalOptOutExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalOptOutExceptionCoordinator {
  return new GlobalOptOutExceptionCoordinator(
    store,
    defaultGlobalOptOutExceptionValidator(),
    clockValue,
    [],
    defaultGlobalOptOutExceptionEngine(flagsValue),
  );
}
