import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryPreferenceTargetEngine,
  defaultPrimaryPreferenceTargetEngine,
} from "./primary-preference-target-engine.js";
import {
  PrimaryPreferenceTargetValidator,
  defaultPrimaryPreferenceTargetValidator,
} from "./primary-preference-target-rules.js";
import { PrimaryPreferenceTargetStore } from "./primary-preference-target-store.js";

/** Moves primary preference targets through their life cycle and keeps a journal of what it did. */
export class PrimaryPreferenceTargetManager {
  store: PrimaryPreferenceTargetStore;
  validator: PrimaryPreferenceTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryPreferenceTargetEngine;

  constructor(
    store: PrimaryPreferenceTargetStore,
    validator: PrimaryPreferenceTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryPreferenceTargetEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary preference target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary preference target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary preference target ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPrimaryPreferenceTargetManager(store: PrimaryPreferenceTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryPreferenceTargetManager {
  return new PrimaryPreferenceTargetManager(
    store,
    defaultPrimaryPreferenceTargetValidator(),
    clockValue,
    [],
    defaultPrimaryPreferenceTargetEngine(flagsValue),
  );
}
