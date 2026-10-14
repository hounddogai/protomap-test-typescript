import * as clock from "../../../../kit/clock.js";
import {
  GlobalEscalationAllocationValidator,
  defaultGlobalEscalationAllocationValidator,
} from "./global-escalation-allocation-rules.js";
import { GlobalEscalationAllocationStore } from "./global-escalation-allocation-store.js";

/** Moves global escalation allocations through their life cycle and keeps a journal of what it did. */
export class GlobalEscalationAllocationService {
  store: GlobalEscalationAllocationStore;
  validator: GlobalEscalationAllocationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalEscalationAllocationStore,
    validator: GlobalEscalationAllocationValidator,
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
      throw new Error(`global escalation allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global escalation allocation ${code} not found`);
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
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalEscalationAllocationService(store: GlobalEscalationAllocationStore, clockValue: clock.Clock): GlobalEscalationAllocationService {
  return new GlobalEscalationAllocationService(store, defaultGlobalEscalationAllocationValidator(), clockValue, []);
}
