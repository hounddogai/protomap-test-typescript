import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeBundleEngine, defaultCreativeBundleEngine } from "./creative-bundle-engine.js";
import { CreativeBundleValidator, defaultCreativeBundleValidator } from "./creative-bundle-rules.js";
import { CreativeBundleStore } from "./creative-bundle-store.js";

/** Moves creative bundles through their life cycle and keeps a journal of what it did. */
export class CreativeBundleManager {
  store: CreativeBundleStore;
  validator: CreativeBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeBundleEngine;

  constructor(
    store: CreativeBundleStore,
    validator: CreativeBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeBundleEngine,
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
      throw new Error(`creative bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative bundle ${code} not found`);
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
      throw new Error(`creative bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCreativeBundleManager(store: CreativeBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeBundleManager {
  return new CreativeBundleManager(
    store,
    defaultCreativeBundleValidator(),
    clockValue,
    [],
    defaultCreativeBundleEngine(flagsValue),
  );
}
