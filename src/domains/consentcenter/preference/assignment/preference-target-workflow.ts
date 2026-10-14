import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PreferenceTargetEngine, defaultPreferenceTargetEngine } from "./preference-target-engine.js";
import { PreferenceTargetValidator, defaultPreferenceTargetValidator } from "./preference-target-rules.js";
import { PreferenceTargetStore } from "./preference-target-store.js";

/** Moves preference targets through their life cycle and keeps a journal of what it did. */
export class PreferenceTargetWorkflow {
  store: PreferenceTargetStore;
  validator: PreferenceTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PreferenceTargetEngine;

  constructor(
    store: PreferenceTargetStore,
    validator: PreferenceTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PreferenceTargetEngine,
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
      throw new Error(`preference target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`preference target ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPreferenceTargetWorkflow(store: PreferenceTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PreferenceTargetWorkflow {
  return new PreferenceTargetWorkflow(
    store,
    defaultPreferenceTargetValidator(),
    clockValue,
    [],
    defaultPreferenceTargetEngine(flagsValue),
  );
}
