import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { EscalationScheduleEngine, defaultEscalationScheduleEngine } from "./escalation-schedule-engine.js";
import { EscalationScheduleValidator, defaultEscalationScheduleValidator } from "./escalation-schedule-rules.js";
import { EscalationScheduleStore } from "./escalation-schedule-store.js";

/** Moves escalation schedules through their life cycle and keeps a journal of what it did. */
export class EscalationScheduleWorkflow {
  store: EscalationScheduleStore;
  validator: EscalationScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationScheduleEngine;

  constructor(
    store: EscalationScheduleStore,
    validator: EscalationScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationScheduleEngine,
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
      throw new Error(`escalation schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation schedule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newEscalationScheduleWorkflow(store: EscalationScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): EscalationScheduleWorkflow {
  return new EscalationScheduleWorkflow(
    store,
    defaultEscalationScheduleValidator(),
    clockValue,
    [],
    defaultEscalationScheduleEngine(flagsValue),
  );
}
