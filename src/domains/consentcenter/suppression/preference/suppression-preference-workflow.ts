import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SuppressionPreferenceEngine, defaultSuppressionPreferenceEngine } from "./suppression-preference-engine.js";
import {
  SuppressionPreferenceValidator,
  defaultSuppressionPreferenceValidator,
} from "./suppression-preference-rules.js";
import { SuppressionPreferenceStore } from "./suppression-preference-store.js";

/** Moves suppression preferences through their life cycle and keeps a journal of what it did. */
export class SuppressionPreferenceCoordinator {
  store: SuppressionPreferenceStore;
  validator: SuppressionPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SuppressionPreferenceEngine;

  constructor(
    store: SuppressionPreferenceStore,
    validator: SuppressionPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SuppressionPreferenceEngine,
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
      throw new Error(`suppression preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression preference ${code} not found`);
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

export function newSuppressionPreferenceCoordinator(store: SuppressionPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): SuppressionPreferenceCoordinator {
  return new SuppressionPreferenceCoordinator(
    store,
    defaultSuppressionPreferenceValidator(),
    clockValue,
    [],
    defaultSuppressionPreferenceEngine(flagsValue),
  );
}
