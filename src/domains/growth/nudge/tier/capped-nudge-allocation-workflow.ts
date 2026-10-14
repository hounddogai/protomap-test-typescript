import * as clock from "../../../../kit/clock.js";
import {
  CappedNudgeAllocationValidator,
  defaultCappedNudgeAllocationValidator,
} from "./capped-nudge-allocation-rules.js";
import { CappedNudgeAllocationStore } from "./capped-nudge-allocation-store.js";

/** Moves capped nudge allocations through their life cycle and keeps a journal of what it did. */
export class CappedNudgeAllocationService {
  store: CappedNudgeAllocationStore;
  validator: CappedNudgeAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedNudgeAllocationStore,
    validator: CappedNudgeAllocationValidator,
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
      throw new Error(`capped nudge allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped nudge allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newCappedNudgeAllocationService(store: CappedNudgeAllocationStore, clockValue: clock.Clock): CappedNudgeAllocationService {
  return new CappedNudgeAllocationService(store, defaultCappedNudgeAllocationValidator(), clockValue, []);
}
