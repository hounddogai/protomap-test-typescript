import * as clock from "../../../../kit/clock.js";
import {
  LegacyActivationExceptionEngine,
  defaultLegacyActivationExceptionEngine,
} from "./legacy-activation-exception-engine.js";
import {
  LegacyActivationExceptionValidator,
  defaultLegacyActivationExceptionValidator,
} from "./legacy-activation-exception-rules.js";
import { LegacyActivationExceptionStore } from "./legacy-activation-exception-store.js";

/** Moves legacy activation exceptions through their life cycle and keeps a journal of what it did. */
export class LegacyActivationExceptionManager {
  store: LegacyActivationExceptionStore;
  validator: LegacyActivationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyActivationExceptionEngine;

  constructor(
    store: LegacyActivationExceptionStore,
    validator: LegacyActivationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyActivationExceptionEngine,
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
      throw new Error(`legacy activation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy activation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy activation exception ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyActivationExceptionManager(store: LegacyActivationExceptionStore, clockValue: clock.Clock): LegacyActivationExceptionManager {
  return new LegacyActivationExceptionManager(
    store,
    defaultLegacyActivationExceptionValidator(),
    clockValue,
    [],
    defaultLegacyActivationExceptionEngine(),
  );
}
