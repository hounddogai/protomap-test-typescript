import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyEscalationExceptionEngine,
  defaultLegacyEscalationExceptionEngine,
} from "./legacy-escalation-exception-engine.js";
import {
  LegacyEscalationExceptionValidator,
  defaultLegacyEscalationExceptionValidator,
} from "./legacy-escalation-exception-rules.js";
import { LegacyEscalationExceptionStore } from "./legacy-escalation-exception-store.js";

/** Moves legacy escalation exceptions through their life cycle and keeps a journal of what it did. */
export class LegacyEscalationExceptionManager {
  store: LegacyEscalationExceptionStore;
  validator: LegacyEscalationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyEscalationExceptionEngine;

  constructor(
    store: LegacyEscalationExceptionStore,
    validator: LegacyEscalationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyEscalationExceptionEngine,
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
      throw new Error(`legacy escalation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy escalation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy escalation exception ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLegacyEscalationExceptionManager(store: LegacyEscalationExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyEscalationExceptionManager {
  return new LegacyEscalationExceptionManager(
    store,
    defaultLegacyEscalationExceptionValidator(),
    clockValue,
    [],
    defaultLegacyEscalationExceptionEngine(flagsValue),
  );
}
