import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  CappedActivationBundleEngine,
  defaultCappedActivationBundleEngine,
} from "./capped-activation-bundle-engine.js";
import {
  CappedActivationBundleValidator,
  defaultCappedActivationBundleValidator,
} from "./capped-activation-bundle-rules.js";
import { CappedActivationBundleStore } from "./capped-activation-bundle-store.js";

/** Moves capped activation bundles through their life cycle and keeps a journal of what it did. */
export class CappedActivationBundleDesk {
  store: CappedActivationBundleStore;
  validator: CappedActivationBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedActivationBundleEngine;

  constructor(
    store: CappedActivationBundleStore,
    validator: CappedActivationBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedActivationBundleEngine,
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
      throw new Error(`capped activation bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped activation bundle ${code} not found`);
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
      throw new Error(`capped activation bundle ${code} not found`);
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

export function newCappedActivationBundleDesk(store: CappedActivationBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedActivationBundleDesk {
  return new CappedActivationBundleDesk(
    store,
    defaultCappedActivationBundleValidator(),
    clockValue,
    [],
    defaultCappedActivationBundleEngine(flagsValue),
  );
}
