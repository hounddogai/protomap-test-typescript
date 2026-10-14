import * as clock from "../../../../kit/clock.js";
import { ScheduledWaitCycleEngine, defaultScheduledWaitCycleEngine } from "./scheduled-wait-cycle-engine.js";
import { ScheduledWaitCycleValidator, defaultScheduledWaitCycleValidator } from "./scheduled-wait-cycle-rules.js";
import { ScheduledWaitCycleStore } from "./scheduled-wait-cycle-store.js";

/** Moves scheduled wait cycles through their life cycle and keeps a journal of what it did. */
export class ScheduledWaitCycleService {
  store: ScheduledWaitCycleStore;
  validator: ScheduledWaitCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledWaitCycleEngine;

  constructor(
    store: ScheduledWaitCycleStore,
    validator: ScheduledWaitCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledWaitCycleEngine,
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
      throw new Error(`scheduled wait cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled wait cycle ${code} not found`);
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
      throw new Error(`scheduled wait cycle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newScheduledWaitCycleService(store: ScheduledWaitCycleStore, clockValue: clock.Clock): ScheduledWaitCycleService {
  return new ScheduledWaitCycleService(
    store,
    defaultScheduledWaitCycleValidator(),
    clockValue,
    [],
    defaultScheduledWaitCycleEngine(),
  );
}
