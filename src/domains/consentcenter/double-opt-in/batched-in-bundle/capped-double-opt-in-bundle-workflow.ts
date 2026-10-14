import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedDoubleOptInBundleEngine,
  defaultCappedDoubleOptInBundleEngine,
} from "./capped-double-opt-in-bundle-engine.js";
import {
  CappedDoubleOptInBundleValidator,
  defaultCappedDoubleOptInBundleValidator,
} from "./capped-double-opt-in-bundle-rules.js";
import { CappedDoubleOptInBundleStore } from "./capped-double-opt-in-bundle-store.js";

/** Moves capped double opt in bundles through their life cycle and keeps a journal of what it did. */
export class CappedDoubleOptInBundleManager {
  store: CappedDoubleOptInBundleStore;
  validator: CappedDoubleOptInBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedDoubleOptInBundleEngine;

  constructor(
    store: CappedDoubleOptInBundleStore,
    validator: CappedDoubleOptInBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedDoubleOptInBundleEngine,
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
      throw new Error(`capped double opt in bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped double opt in bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped double opt in bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedDoubleOptInBundleManager(store: CappedDoubleOptInBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedDoubleOptInBundleManager {
  return new CappedDoubleOptInBundleManager(
    store,
    defaultCappedDoubleOptInBundleValidator(),
    clockValue,
    [],
    defaultCappedDoubleOptInBundleEngine(flagsValue),
  );
}
