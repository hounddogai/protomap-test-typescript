import * as clock from "../../../../kit/clock.js";
import { DefaultBadgeGroupValidator, defaultDefaultBadgeGroupValidator } from "./default-badge-group-rules.js";
import { DefaultBadgeGroupStore } from "./default-badge-group-store.js";

/** Moves default badge groups through their life cycle and keeps a journal of what it did. */
export class DefaultBadgeGroupManager {
  store: DefaultBadgeGroupStore;
  validator: DefaultBadgeGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultBadgeGroupStore,
    validator: DefaultBadgeGroupValidator,
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
      throw new Error(`default badge group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default badge group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultBadgeGroupManager(store: DefaultBadgeGroupStore, clockValue: clock.Clock): DefaultBadgeGroupManager {
  return new DefaultBadgeGroupManager(store, defaultDefaultBadgeGroupValidator(), clockValue, []);
}
