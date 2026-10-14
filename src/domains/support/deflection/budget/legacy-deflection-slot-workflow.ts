import * as clock from "../../../../kit/clock.js";
import {
  LegacyDeflectionSlotValidator,
  defaultLegacyDeflectionSlotValidator,
} from "./legacy-deflection-slot-rules.js";
import { LegacyDeflectionSlotStore } from "./legacy-deflection-slot-store.js";

/** Moves legacy deflection slots through their life cycle and keeps a journal of what it did. */
export class LegacyDeflectionSlotWorkflow {
  store: LegacyDeflectionSlotStore;
  validator: LegacyDeflectionSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyDeflectionSlotStore,
    validator: LegacyDeflectionSlotValidator,
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
      throw new Error(`legacy deflection slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newLegacyDeflectionSlotWorkflow(store: LegacyDeflectionSlotStore, clockValue: clock.Clock): LegacyDeflectionSlotWorkflow {
  return new LegacyDeflectionSlotWorkflow(store, defaultLegacyDeflectionSlotValidator(), clockValue, []);
}
