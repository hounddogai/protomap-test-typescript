import * as clock from "../../../../kit/clock.js";
import {
  PendingEscalationExceptionEngine,
  defaultPendingEscalationExceptionEngine,
} from "./pending-escalation-exception-engine.js";
import {
  PendingEscalationExceptionValidator,
  defaultPendingEscalationExceptionValidator,
} from "./pending-escalation-exception-rules.js";
import { PendingEscalationExceptionStore } from "./pending-escalation-exception-store.js";

/** Moves pending escalation exceptions through their life cycle and keeps a journal of what it did. */
export class PendingEscalationExceptionManager {
  store: PendingEscalationExceptionStore;
  validator: PendingEscalationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingEscalationExceptionEngine;

  constructor(
    store: PendingEscalationExceptionStore,
    validator: PendingEscalationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingEscalationExceptionEngine,
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
      throw new Error(`pending escalation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending escalation exception ${code} not found`);
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
      throw new Error(`pending escalation exception ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPendingEscalationExceptionManager(store: PendingEscalationExceptionStore, clockValue: clock.Clock): PendingEscalationExceptionManager {
  return new PendingEscalationExceptionManager(
    store,
    defaultPendingEscalationExceptionValidator(),
    clockValue,
    [],
    defaultPendingEscalationExceptionEngine(),
  );
}
