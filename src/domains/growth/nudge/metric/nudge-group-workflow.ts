import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { NudgeGroupEngine, defaultNudgeGroupEngine } from "./nudge-group-engine.js";
import { NudgeGroupValidator, defaultNudgeGroupValidator } from "./nudge-group-rules.js";
import { NudgeGroupStore } from "./nudge-group-store.js";

/** Moves nudge groups through their life cycle and keeps a journal of what it did. */
export class NudgeGroupCoordinator {
  store: NudgeGroupStore;
  validator: NudgeGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeGroupEngine;

  constructor(
    store: NudgeGroupStore,
    validator: NudgeGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeGroupEngine,
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
      throw new Error(`nudge group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge group ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newNudgeGroupCoordinator(store: NudgeGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): NudgeGroupCoordinator {
  return new NudgeGroupCoordinator(
    store,
    defaultNudgeGroupValidator(),
    clockValue,
    [],
    defaultNudgeGroupEngine(flagsValue),
  );
}
