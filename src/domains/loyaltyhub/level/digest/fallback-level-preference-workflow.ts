import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackLevelPreferenceEngine,
  defaultFallbackLevelPreferenceEngine,
} from "./fallback-level-preference-engine.js";
import {
  FallbackLevelPreferenceValidator,
  defaultFallbackLevelPreferenceValidator,
} from "./fallback-level-preference-rules.js";
import { FallbackLevelPreferenceStore } from "./fallback-level-preference-store.js";

/** Moves fallback level preferences through their life cycle and keeps a journal of what it did. */
export class FallbackLevelPreferenceCoordinator {
  store: FallbackLevelPreferenceStore;
  validator: FallbackLevelPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackLevelPreferenceEngine;

  constructor(
    store: FallbackLevelPreferenceStore,
    validator: FallbackLevelPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackLevelPreferenceEngine,
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
      throw new Error(`fallback level preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback level preference ${code} not found`);
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
      throw new Error(`fallback level preference ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackLevelPreferenceCoordinator(store: FallbackLevelPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackLevelPreferenceCoordinator {
  return new FallbackLevelPreferenceCoordinator(
    store,
    defaultFallbackLevelPreferenceValidator(),
    clockValue,
    [],
    defaultFallbackLevelPreferenceEngine(flagsValue),
  );
}
