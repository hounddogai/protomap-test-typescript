import * as clock from "../../../../kit/clock.js";
import { LegacyQueuePolicyValidator, defaultLegacyQueuePolicyValidator } from "./legacy-queue-policy-rules.js";
import { LegacyQueuePolicyStore } from "./legacy-queue-policy-store.js";

/** Moves legacy queue policies through their life cycle and keeps a journal of what it did. */
export class LegacyQueuePolicyDesk {
  store: LegacyQueuePolicyStore;
  validator: LegacyQueuePolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyQueuePolicyStore,
    validator: LegacyQueuePolicyValidator,
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
      throw new Error(`legacy queue policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy queue policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyQueuePolicyDesk(store: LegacyQueuePolicyStore, clockValue: clock.Clock): LegacyQueuePolicyDesk {
  return new LegacyQueuePolicyDesk(store, defaultLegacyQueuePolicyValidator(), clockValue, []);
}
