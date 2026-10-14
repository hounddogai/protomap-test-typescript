import * as clock from "../../../../kit/clock.js";
import {
  SuppressionAllocationValidator,
  defaultSuppressionAllocationValidator,
} from "./suppression-allocation-rules.js";
import { SuppressionAllocationStore } from "./suppression-allocation-store.js";

/** Moves suppression allocations through their life cycle and keeps a journal of what it did. */
export class SuppressionAllocationService {
  store: SuppressionAllocationStore;
  validator: SuppressionAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SuppressionAllocationStore,
    validator: SuppressionAllocationValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newSuppressionAllocationService(store: SuppressionAllocationStore, clockValue: clock.Clock): SuppressionAllocationService {
  return new SuppressionAllocationService(store, defaultSuppressionAllocationValidator(), clockValue, []);
}
