import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EscalationExceptionEngine, defaultEscalationExceptionEngine } from "./escalation-exception-engine.js";
import { EscalationExceptionValidator, defaultEscalationExceptionValidator } from "./escalation-exception-rules.js";
import { EscalationExceptionStore } from "./escalation-exception-store.js";

/** Moves escalation exceptions through their life cycle and keeps a journal of what it did. */
export class EscalationExceptionWorkflow {
  store: EscalationExceptionStore;
  validator: EscalationExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationExceptionEngine;

  constructor(
    store: EscalationExceptionStore,
    validator: EscalationExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationExceptionEngine,
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
      throw new Error(`escalation exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation exception ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newEscalationExceptionWorkflow(store: EscalationExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): EscalationExceptionWorkflow {
  return new EscalationExceptionWorkflow(
    store,
    defaultEscalationExceptionValidator(),
    clockValue,
    [],
    defaultEscalationExceptionEngine(flagsValue),
  );
}
