import * as clock from "../../../../kit/clock.js";
import {
  LegacyFrequencyTargetValidator,
  defaultLegacyFrequencyTargetValidator,
} from "./legacy-frequency-target-rules.js";
import { LegacyFrequencyTargetStore } from "./legacy-frequency-target-store.js";

/** Moves legacy frequency targets through their life cycle and keeps a journal of what it did. */
export class LegacyFrequencyTargetService {
  store: LegacyFrequencyTargetStore;
  validator: LegacyFrequencyTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyFrequencyTargetStore,
    validator: LegacyFrequencyTargetValidator,
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
      throw new Error(`legacy frequency target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy frequency target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newLegacyFrequencyTargetService(store: LegacyFrequencyTargetStore, clockValue: clock.Clock): LegacyFrequencyTargetService {
  return new LegacyFrequencyTargetService(store, defaultLegacyFrequencyTargetValidator(), clockValue, []);
}
