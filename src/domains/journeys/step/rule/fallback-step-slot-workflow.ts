import * as clock from "../../../../kit/clock.js";
import { FallbackStepSlotValidator, defaultFallbackStepSlotValidator } from "./fallback-step-slot-rules.js";
import { FallbackStepSlotStore } from "./fallback-step-slot-store.js";

/** Moves fallback step slots through their life cycle and keeps a journal of what it did. */
export class FallbackStepSlotService {
  store: FallbackStepSlotStore;
  validator: FallbackStepSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackStepSlotStore,
    validator: FallbackStepSlotValidator,
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
      throw new Error(`fallback step slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback step slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newFallbackStepSlotService(store: FallbackStepSlotStore, clockValue: clock.Clock): FallbackStepSlotService {
  return new FallbackStepSlotService(store, defaultFallbackStepSlotValidator(), clockValue, []);
}
