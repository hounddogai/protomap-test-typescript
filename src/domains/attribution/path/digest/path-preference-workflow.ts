import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathPreferenceEngine, defaultPathPreferenceEngine } from "./path-preference-engine.js";
import { PathPreferenceValidator, defaultPathPreferenceValidator } from "./path-preference-rules.js";
import { PathPreferenceStore } from "./path-preference-store.js";

/** Moves path preferences through their life cycle and keeps a journal of what it did. */
export class PathPreferenceCoordinator {
  store: PathPreferenceStore;
  validator: PathPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathPreferenceEngine;

  constructor(
    store: PathPreferenceStore,
    validator: PathPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathPreferenceEngine,
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
      throw new Error(`path preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path preference ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPathPreferenceCoordinator(store: PathPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathPreferenceCoordinator {
  return new PathPreferenceCoordinator(
    store,
    defaultPathPreferenceValidator(),
    clockValue,
    [],
    defaultPathPreferenceEngine(flagsValue),
  );
}
