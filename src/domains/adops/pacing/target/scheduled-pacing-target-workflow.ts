import * as clock from "../../../../kit/clock.js";
import {
  ScheduledPacingTargetValidator,
  defaultScheduledPacingTargetValidator,
} from "./scheduled-pacing-target-rules.js";
import { ScheduledPacingTargetStore } from "./scheduled-pacing-target-store.js";

/** Moves scheduled pacing targets through their life cycle and keeps a journal of what it did. */
export class ScheduledPacingTargetCoordinator {
  store: ScheduledPacingTargetStore;
  validator: ScheduledPacingTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledPacingTargetStore,
    validator: ScheduledPacingTargetValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled pacing target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled pacing target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newScheduledPacingTargetCoordinator(store: ScheduledPacingTargetStore, clockValue: clock.Clock): ScheduledPacingTargetCoordinator {
  return new ScheduledPacingTargetCoordinator(store, defaultScheduledPacingTargetValidator(), clockValue, []);
}
