import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultFraudCheckBundleEngine,
  defaultDefaultFraudCheckBundleEngine,
} from "./default-fraud-check-bundle-engine.js";
import {
  DefaultFraudCheckBundleValidator,
  defaultDefaultFraudCheckBundleValidator,
} from "./default-fraud-check-bundle-rules.js";
import { DefaultFraudCheckBundleStore } from "./default-fraud-check-bundle-store.js";

/** Moves default fraud check bundles through their life cycle and keeps a journal of what it did. */
export class DefaultFraudCheckBundleDesk {
  store: DefaultFraudCheckBundleStore;
  validator: DefaultFraudCheckBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFraudCheckBundleEngine;

  constructor(
    store: DefaultFraudCheckBundleStore,
    validator: DefaultFraudCheckBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFraudCheckBundleEngine,
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
      throw new Error(`default fraud check bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default fraud check bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default fraud check bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newDefaultFraudCheckBundleDesk(store: DefaultFraudCheckBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultFraudCheckBundleDesk {
  return new DefaultFraudCheckBundleDesk(
    store,
    defaultDefaultFraudCheckBundleValidator(),
    clockValue,
    [],
    defaultDefaultFraudCheckBundleEngine(flagsValue),
  );
}
