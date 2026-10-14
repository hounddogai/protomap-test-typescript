import * as clock from "../../../../kit/clock.js";
import { LegacyBadgePreferenceEngine, defaultLegacyBadgePreferenceEngine } from "./legacy-badge-preference-engine.js";
import {
  LegacyBadgePreferenceValidator,
  defaultLegacyBadgePreferenceValidator,
} from "./legacy-badge-preference-rules.js";
import { LegacyBadgePreferenceStore } from "./legacy-badge-preference-store.js";

/** Moves legacy badge preferences through their life cycle and keeps a journal of what it did. */
export class LegacyBadgePreferenceCoordinator {
  store: LegacyBadgePreferenceStore;
  validator: LegacyBadgePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyBadgePreferenceEngine;

  constructor(
    store: LegacyBadgePreferenceStore,
    validator: LegacyBadgePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyBadgePreferenceEngine,
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
      throw new Error(`legacy badge preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy badge preference ${code} not found`);
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
      throw new Error(`legacy badge preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacyBadgePreferenceCoordinator(store: LegacyBadgePreferenceStore, clockValue: clock.Clock): LegacyBadgePreferenceCoordinator {
  return new LegacyBadgePreferenceCoordinator(
    store,
    defaultLegacyBadgePreferenceValidator(),
    clockValue,
    [],
    defaultLegacyBadgePreferenceEngine(),
  );
}
