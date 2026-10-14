import * as clock from "../../../../kit/clock.js";
import { RollingCsatCycleValidator, defaultRollingCsatCycleValidator } from "./rolling-csat-cycle-rules.js";
import { RollingCsatCycleStore } from "./rolling-csat-cycle-store.js";

/** Moves rolling csat cycles through their life cycle and keeps a journal of what it did. */
export class RollingCsatCycleManager {
  store: RollingCsatCycleStore;
  validator: RollingCsatCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingCsatCycleStore,
    validator: RollingCsatCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling csat cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling csat cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newRollingCsatCycleManager(store: RollingCsatCycleStore, clockValue: clock.Clock): RollingCsatCycleManager {
  return new RollingCsatCycleManager(store, defaultRollingCsatCycleValidator(), clockValue, []);
}
