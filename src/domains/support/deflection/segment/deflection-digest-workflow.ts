import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DeflectionDigestEngine, defaultDeflectionDigestEngine } from "./deflection-digest-engine.js";
import { DeflectionDigestValidator, defaultDeflectionDigestValidator } from "./deflection-digest-rules.js";
import { DeflectionDigestStore } from "./deflection-digest-store.js";

/** Moves deflection digests through their life cycle and keeps a journal of what it did. */
export class DeflectionDigestManager {
  store: DeflectionDigestStore;
  validator: DeflectionDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionDigestEngine;

  constructor(
    store: DeflectionDigestStore,
    validator: DeflectionDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionDigestEngine,
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
      throw new Error(`deflection digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection digest ${code} not found`);
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
      throw new Error(`deflection digest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newDeflectionDigestManager(store: DeflectionDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): DeflectionDigestManager {
  return new DeflectionDigestManager(
    store,
    defaultDeflectionDigestValidator(),
    clockValue,
    [],
    defaultDeflectionDigestEngine(flagsValue),
  );
}
