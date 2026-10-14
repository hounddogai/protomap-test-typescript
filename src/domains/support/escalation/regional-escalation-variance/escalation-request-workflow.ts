import * as clock from "../../../../kit/clock.js";
import { EscalationRequestEngine, defaultEscalationRequestEngine } from "./escalation-request-engine.js";
import { EscalationRequestValidator, defaultEscalationRequestValidator } from "./escalation-request-rules.js";
import { EscalationRequestStore } from "./escalation-request-store.js";

/** Moves escalation requests through their life cycle and keeps a journal of what it did. */
export class EscalationRequestManager {
  store: EscalationRequestStore;
  validator: EscalationRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationRequestEngine;

  constructor(
    store: EscalationRequestStore,
    validator: EscalationRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationRequestEngine,
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
      throw new Error(`escalation request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation request ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newEscalationRequestManager(store: EscalationRequestStore, clockValue: clock.Clock): EscalationRequestManager {
  return new EscalationRequestManager(
    store,
    defaultEscalationRequestValidator(),
    clockValue,
    [],
    defaultEscalationRequestEngine(),
  );
}
