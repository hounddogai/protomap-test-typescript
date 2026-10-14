import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictWindowProfileEngine, defaultStrictWindowProfileEngine } from "./strict-window-profile-engine.js";
import { StrictWindowProfileValidator, defaultStrictWindowProfileValidator } from "./strict-window-profile-rules.js";
import { StrictWindowProfileStore } from "./strict-window-profile-store.js";

/** Moves strict window profiles through their life cycle and keeps a journal of what it did. */
export class StrictWindowProfileWorkflow {
  store: StrictWindowProfileStore;
  validator: StrictWindowProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictWindowProfileEngine;

  constructor(
    store: StrictWindowProfileStore,
    validator: StrictWindowProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictWindowProfileEngine,
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
      throw new Error(`strict window profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict window profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict window profile ${code} not found`);
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

export function newStrictWindowProfileWorkflow(store: StrictWindowProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictWindowProfileWorkflow {
  return new StrictWindowProfileWorkflow(
    store,
    defaultStrictWindowProfileValidator(),
    clockValue,
    [],
    defaultStrictWindowProfileEngine(flagsValue),
  );
}
