import * as clock from "../../../../kit/clock.js";
import { LenientSlaProfileValidator, defaultLenientSlaProfileValidator } from "./lenient-sla-profile-rules.js";
import { LenientSlaProfileStore } from "./lenient-sla-profile-store.js";

/** Moves lenient sla profiles through their life cycle and keeps a journal of what it did. */
export class LenientSlaProfileCoordinator {
  store: LenientSlaProfileStore;
  validator: LenientSlaProfileValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientSlaProfileStore,
    validator: LenientSlaProfileValidator,
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
      throw new Error(`lenient sla profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient sla profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientSlaProfileCoordinator(store: LenientSlaProfileStore, clockValue: clock.Clock): LenientSlaProfileCoordinator {
  return new LenientSlaProfileCoordinator(store, defaultLenientSlaProfileValidator(), clockValue, []);
}
