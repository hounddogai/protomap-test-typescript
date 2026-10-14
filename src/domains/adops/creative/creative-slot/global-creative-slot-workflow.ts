import * as clock from "../../../../kit/clock.js";
import { GlobalCreativeSlotValidator, defaultGlobalCreativeSlotValidator } from "./global-creative-slot-rules.js";
import { GlobalCreativeSlotStore } from "./global-creative-slot-store.js";

/** Moves global creative slots through their life cycle and keeps a journal of what it did. */
export class GlobalCreativeSlotCoordinator {
  store: GlobalCreativeSlotStore;
  validator: GlobalCreativeSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalCreativeSlotStore,
    validator: GlobalCreativeSlotValidator,
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
      throw new Error(`global creative slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global creative slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalCreativeSlotCoordinator(store: GlobalCreativeSlotStore, clockValue: clock.Clock): GlobalCreativeSlotCoordinator {
  return new GlobalCreativeSlotCoordinator(store, defaultGlobalCreativeSlotValidator(), clockValue, []);
}
