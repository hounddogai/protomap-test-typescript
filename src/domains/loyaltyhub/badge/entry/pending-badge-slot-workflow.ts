import * as clock from "../../../../kit/clock.js";
import { PendingBadgeSlotEngine, defaultPendingBadgeSlotEngine } from "./pending-badge-slot-engine.js";
import { PendingBadgeSlotValidator, defaultPendingBadgeSlotValidator } from "./pending-badge-slot-rules.js";
import { PendingBadgeSlotStore } from "./pending-badge-slot-store.js";

/** Moves pending badge slots through their life cycle and keeps a journal of what it did. */
export class PendingBadgeSlotDesk {
  store: PendingBadgeSlotStore;
  validator: PendingBadgeSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBadgeSlotEngine;

  constructor(
    store: PendingBadgeSlotStore,
    validator: PendingBadgeSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBadgeSlotEngine,
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
      throw new Error(`pending badge slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending badge slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending badge slot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPendingBadgeSlotDesk(store: PendingBadgeSlotStore, clockValue: clock.Clock): PendingBadgeSlotDesk {
  return new PendingBadgeSlotDesk(
    store,
    defaultPendingBadgeSlotValidator(),
    clockValue,
    [],
    defaultPendingBadgeSlotEngine(),
  );
}
