import * as clock from "../../../../kit/clock.js";
import { CreativeScheduleEngine, defaultCreativeScheduleEngine } from "./creative-schedule-engine.js";
import { CreativeScheduleValidator, defaultCreativeScheduleValidator } from "./creative-schedule-rules.js";
import { CreativeScheduleStore } from "./creative-schedule-store.js";

/** Moves creative schedules through their life cycle and keeps a journal of what it did. */
export class CreativeScheduleCoordinator {
  store: CreativeScheduleStore;
  validator: CreativeScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeScheduleEngine;

  constructor(
    store: CreativeScheduleStore,
    validator: CreativeScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeScheduleEngine,
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
      throw new Error(`creative schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative schedule ${code} not found`);
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
      throw new Error(`creative schedule ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newCreativeScheduleCoordinator(store: CreativeScheduleStore, clockValue: clock.Clock): CreativeScheduleCoordinator {
  return new CreativeScheduleCoordinator(
    store,
    defaultCreativeScheduleValidator(),
    clockValue,
    [],
    defaultCreativeScheduleEngine(),
  );
}
