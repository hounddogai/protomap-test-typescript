import * as clock from "../../../../kit/clock.js";
import { PendingInviteSlotEngine, defaultPendingInviteSlotEngine } from "./pending-invite-slot-engine.js";
import { PendingInviteSlotValidator, defaultPendingInviteSlotValidator } from "./pending-invite-slot-rules.js";
import { PendingInviteSlotStore } from "./pending-invite-slot-store.js";

/** Moves pending invite slots through their life cycle and keeps a journal of what it did. */
export class PendingInviteSlotCoordinator {
  store: PendingInviteSlotStore;
  validator: PendingInviteSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingInviteSlotEngine;

  constructor(
    store: PendingInviteSlotStore,
    validator: PendingInviteSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingInviteSlotEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPendingInviteSlotCoordinator(store: PendingInviteSlotStore, clockValue: clock.Clock): PendingInviteSlotCoordinator {
  return new PendingInviteSlotCoordinator(
    store,
    defaultPendingInviteSlotValidator(),
    clockValue,
    [],
    defaultPendingInviteSlotEngine(),
  );
}
