import * as clock from "../../../../kit/clock.js";
import { RetentionPolicyValidator, defaultRetentionPolicyValidator } from "./retention-policy-rules.js";
import { RetentionPolicyStore } from "./retention-policy-store.js";

/** Moves retention policies through their life cycle and keeps a journal of what it did. */
export class RetentionPolicyCoordinator {
  store: RetentionPolicyStore;
  validator: RetentionPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RetentionPolicyStore,
    validator: RetentionPolicyValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention policy ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionPolicyCoordinator(store: RetentionPolicyStore, clockValue: clock.Clock): RetentionPolicyCoordinator {
  return new RetentionPolicyCoordinator(store, defaultRetentionPolicyValidator(), clockValue, []);
}
