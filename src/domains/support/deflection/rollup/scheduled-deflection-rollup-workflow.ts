import * as clock from "../../../../kit/clock.js";
import {
  ScheduledDeflectionRollupValidator,
  defaultScheduledDeflectionRollupValidator,
} from "./scheduled-deflection-rollup-rules.js";
import { ScheduledDeflectionRollupStore } from "./scheduled-deflection-rollup-store.js";

/** Moves scheduled deflection rollups through their life cycle and keeps a journal of what it did. */
export class ScheduledDeflectionRollupService {
  store: ScheduledDeflectionRollupStore;
  validator: ScheduledDeflectionRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledDeflectionRollupStore,
    validator: ScheduledDeflectionRollupValidator,
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
      throw new Error(`scheduled deflection rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newScheduledDeflectionRollupService(store: ScheduledDeflectionRollupStore, clockValue: clock.Clock): ScheduledDeflectionRollupService {
  return new ScheduledDeflectionRollupService(store, defaultScheduledDeflectionRollupValidator(), clockValue, []);
}
