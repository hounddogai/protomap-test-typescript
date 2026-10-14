import * as clock from "../../../../kit/clock.js";
import {
  ManualEscalationScheduleEngine,
  defaultManualEscalationScheduleEngine,
} from "./manual-escalation-schedule-engine.js";
import {
  ManualEscalationScheduleValidator,
  defaultManualEscalationScheduleValidator,
} from "./manual-escalation-schedule-rules.js";
import { ManualEscalationScheduleStore } from "./manual-escalation-schedule-store.js";

/** Moves manual escalation schedules through their life cycle and keeps a journal of what it did. */
export class ManualEscalationScheduleWorkflow {
  store: ManualEscalationScheduleStore;
  validator: ManualEscalationScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualEscalationScheduleEngine;

  constructor(
    store: ManualEscalationScheduleStore,
    validator: ManualEscalationScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualEscalationScheduleEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual escalation schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual escalation schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual escalation schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newManualEscalationScheduleWorkflow(store: ManualEscalationScheduleStore, clockValue: clock.Clock): ManualEscalationScheduleWorkflow {
  return new ManualEscalationScheduleWorkflow(
    store,
    defaultManualEscalationScheduleValidator(),
    clockValue,
    [],
    defaultManualEscalationScheduleEngine(),
  );
}
