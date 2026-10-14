import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingBundleEngine, defaultPacingBundleEngine } from "./pacing-bundle-engine.js";
import { PacingBundleValidator, defaultPacingBundleValidator } from "./pacing-bundle-rules.js";
import { PacingBundleStore } from "./pacing-bundle-store.js";

/** Moves pacing bundles through their life cycle and keeps a journal of what it did. */
export class PacingBundleService {
  store: PacingBundleStore;
  validator: PacingBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingBundleEngine;

  constructor(
    store: PacingBundleStore,
    validator: PacingBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingBundleEngine,
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
      throw new Error(`pacing bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing bundle ${code} not found`);
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
      throw new Error(`pacing bundle ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPacingBundleService(store: PacingBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingBundleService {
  return new PacingBundleService(
    store,
    defaultPacingBundleValidator(),
    clockValue,
    [],
    defaultPacingBundleEngine(flagsValue),
  );
}
