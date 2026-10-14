import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientActivationBundleEngine,
  defaultLenientActivationBundleEngine,
} from "./lenient-activation-bundle-engine.js";
import {
  LenientActivationBundleValidator,
  defaultLenientActivationBundleValidator,
} from "./lenient-activation-bundle-rules.js";
import { LenientActivationBundleStore } from "./lenient-activation-bundle-store.js";

/** Moves lenient activation bundles through their life cycle and keeps a journal of what it did. */
export class LenientActivationBundleCoordinator {
  store: LenientActivationBundleStore;
  validator: LenientActivationBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientActivationBundleEngine;

  constructor(
    store: LenientActivationBundleStore,
    validator: LenientActivationBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientActivationBundleEngine,
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
      throw new Error(`lenient activation bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient activation bundle ${code} not found`);
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
      throw new Error(`lenient activation bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientActivationBundleCoordinator(store: LenientActivationBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientActivationBundleCoordinator {
  return new LenientActivationBundleCoordinator(
    store,
    defaultLenientActivationBundleValidator(),
    clockValue,
    [],
    defaultLenientActivationBundleEngine(flagsValue),
  );
}
