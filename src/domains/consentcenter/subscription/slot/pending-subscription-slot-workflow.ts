import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingSubscriptionSlotEngine,
  defaultPendingSubscriptionSlotEngine,
} from "./pending-subscription-slot-engine.js";
import {
  PendingSubscriptionSlotValidator,
  defaultPendingSubscriptionSlotValidator,
} from "./pending-subscription-slot-rules.js";
import { PendingSubscriptionSlotStore } from "./pending-subscription-slot-store.js";

/** Moves pending subscription slots through their life cycle and keeps a journal of what it did. */
export class PendingSubscriptionSlotManager {
  store: PendingSubscriptionSlotStore;
  validator: PendingSubscriptionSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingSubscriptionSlotEngine;

  constructor(
    store: PendingSubscriptionSlotStore,
    validator: PendingSubscriptionSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingSubscriptionSlotEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending subscription slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending subscription slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending subscription slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingSubscriptionSlotManager(store: PendingSubscriptionSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingSubscriptionSlotManager {
  return new PendingSubscriptionSlotManager(
    store,
    defaultPendingSubscriptionSlotValidator(),
    clockValue,
    [],
    defaultPendingSubscriptionSlotEngine(flagsValue),
  );
}
