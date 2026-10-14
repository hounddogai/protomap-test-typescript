import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultStreakTargetEngine, defaultDefaultStreakTargetEngine } from "./default-streak-target-engine.js";
import { DefaultStreakTargetValidator, defaultDefaultStreakTargetValidator } from "./default-streak-target-rules.js";
import { DefaultStreakTargetStore } from "./default-streak-target-store.js";

/** Moves default streak targets through their life cycle and keeps a journal of what it did. */
export class DefaultStreakTargetDesk {
  store: DefaultStreakTargetStore;
  validator: DefaultStreakTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultStreakTargetEngine;

  constructor(
    store: DefaultStreakTargetStore,
    validator: DefaultStreakTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultStreakTargetEngine,
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
      throw new Error(`default streak target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default streak target ${code} not found`);
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
      throw new Error(`default streak target ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDefaultStreakTargetDesk(store: DefaultStreakTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultStreakTargetDesk {
  return new DefaultStreakTargetDesk(
    store,
    defaultDefaultStreakTargetValidator(),
    clockValue,
    [],
    defaultDefaultStreakTargetEngine(flagsValue),
  );
}
