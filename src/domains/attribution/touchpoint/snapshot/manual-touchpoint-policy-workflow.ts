import * as clock from "../../../../kit/clock.js";
import {
  ManualTouchpointPolicyValidator,
  defaultManualTouchpointPolicyValidator,
} from "./manual-touchpoint-policy-rules.js";
import { ManualTouchpointPolicyStore } from "./manual-touchpoint-policy-store.js";

/** Moves manual touchpoint policies through their life cycle and keeps a journal of what it did. */
export class ManualTouchpointPolicyManager {
  store: ManualTouchpointPolicyStore;
  validator: ManualTouchpointPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualTouchpointPolicyStore,
    validator: ManualTouchpointPolicyValidator,
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
      throw new Error(`manual touchpoint policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual touchpoint policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualTouchpointPolicyManager(store: ManualTouchpointPolicyStore, clockValue: clock.Clock): ManualTouchpointPolicyManager {
  return new ManualTouchpointPolicyManager(store, defaultManualTouchpointPolicyValidator(), clockValue, []);
}
