import * as clock from "../../../../kit/clock.js";
import {
  DefaultEscalationScheduleEngine,
  defaultDefaultEscalationScheduleEngine,
} from "./default-escalation-schedule-engine.js";
import {
  DefaultEscalationScheduleValidator,
  defaultDefaultEscalationScheduleValidator,
} from "./default-escalation-schedule-rules.js";
import { DefaultEscalationScheduleStore } from "./default-escalation-schedule-store.js";

/** Moves default escalation schedules through their life cycle and keeps a journal of what it did. */
export class DefaultEscalationScheduleCoordinator {
  store: DefaultEscalationScheduleStore;
  validator: DefaultEscalationScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultEscalationScheduleEngine;

  constructor(
    store: DefaultEscalationScheduleStore,
    validator: DefaultEscalationScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultEscalationScheduleEngine,
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
      throw new Error(`default escalation schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default escalation schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default escalation schedule ${code} not found`);
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

export function newDefaultEscalationScheduleCoordinator(store: DefaultEscalationScheduleStore, clockValue: clock.Clock): DefaultEscalationScheduleCoordinator {
  return new DefaultEscalationScheduleCoordinator(
    store,
    defaultDefaultEscalationScheduleValidator(),
    clockValue,
    [],
    defaultDefaultEscalationScheduleEngine(),
  );
}
