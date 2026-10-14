import * as clock from "../../../../kit/clock.js";
import { GlobalNudgeWindowValidator, defaultGlobalNudgeWindowValidator } from "./global-nudge-window-rules.js";
import { GlobalNudgeWindowStore } from "./global-nudge-window-store.js";

/** Moves global nudge windows through their life cycle and keeps a journal of what it did. */
export class GlobalNudgeWindowCoordinator {
  store: GlobalNudgeWindowStore;
  validator: GlobalNudgeWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalNudgeWindowStore,
    validator: GlobalNudgeWindowValidator,
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
      throw new Error(`global nudge window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global nudge window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newGlobalNudgeWindowCoordinator(store: GlobalNudgeWindowStore, clockValue: clock.Clock): GlobalNudgeWindowCoordinator {
  return new GlobalNudgeWindowCoordinator(store, defaultGlobalNudgeWindowValidator(), clockValue, []);
}
