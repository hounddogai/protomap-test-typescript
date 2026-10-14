import * as clock from "../../../../kit/clock.js";
import {
  FallbackActivationSlotValidator,
  defaultFallbackActivationSlotValidator,
} from "./fallback-activation-slot-rules.js";
import { FallbackActivationSlotStore } from "./fallback-activation-slot-store.js";

/** Moves fallback activation slots through their life cycle and keeps a journal of what it did. */
export class FallbackActivationSlotManager {
  store: FallbackActivationSlotStore;
  validator: FallbackActivationSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackActivationSlotStore,
    validator: FallbackActivationSlotValidator,
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
      throw new Error(`fallback activation slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback activation slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newFallbackActivationSlotManager(store: FallbackActivationSlotStore, clockValue: clock.Clock): FallbackActivationSlotManager {
  return new FallbackActivationSlotManager(store, defaultFallbackActivationSlotValidator(), clockValue, []);
}
