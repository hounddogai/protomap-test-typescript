import * as clock from "../../../../kit/clock.js";
import { GlobalFlightGroupValidator, defaultGlobalFlightGroupValidator } from "./global-flight-group-rules.js";
import { GlobalFlightGroupStore } from "./global-flight-group-store.js";

/** Moves global flight groups through their life cycle and keeps a journal of what it did. */
export class GlobalFlightGroupCoordinator {
  store: GlobalFlightGroupStore;
  validator: GlobalFlightGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalFlightGroupStore,
    validator: GlobalFlightGroupValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global flight group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global flight group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newGlobalFlightGroupCoordinator(store: GlobalFlightGroupStore, clockValue: clock.Clock): GlobalFlightGroupCoordinator {
  return new GlobalFlightGroupCoordinator(store, defaultGlobalFlightGroupValidator(), clockValue, []);
}
