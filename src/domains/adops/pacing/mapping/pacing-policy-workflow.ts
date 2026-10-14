import * as clock from "../../../../kit/clock.js";
import { PacingPolicyValidator, defaultPacingPolicyValidator } from "./pacing-policy-rules.js";
import { PacingPolicyStore } from "./pacing-policy-store.js";

/** Moves pacing policies through their life cycle and keeps a journal of what it did. */
export class PacingPolicyWorkflow {
  store: PacingPolicyStore;
  validator: PacingPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PacingPolicyStore,
    validator: PacingPolicyValidator,
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
      throw new Error(`pacing policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPacingPolicyWorkflow(store: PacingPolicyStore, clockValue: clock.Clock): PacingPolicyWorkflow {
  return new PacingPolicyWorkflow(store, defaultPacingPolicyValidator(), clockValue, []);
}
