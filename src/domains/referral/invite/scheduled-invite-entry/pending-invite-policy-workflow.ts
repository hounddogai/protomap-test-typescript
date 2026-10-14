import * as clock from "../../../../kit/clock.js";
import { PendingInvitePolicyEngine, defaultPendingInvitePolicyEngine } from "./pending-invite-policy-engine.js";
import { PendingInvitePolicyValidator, defaultPendingInvitePolicyValidator } from "./pending-invite-policy-rules.js";
import { PendingInvitePolicyStore } from "./pending-invite-policy-store.js";

/** Moves pending invite policies through their life cycle and keeps a journal of what it did. */
export class PendingInvitePolicyWorkflow {
  store: PendingInvitePolicyStore;
  validator: PendingInvitePolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingInvitePolicyEngine;

  constructor(
    store: PendingInvitePolicyStore,
    validator: PendingInvitePolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingInvitePolicyEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending invite policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newPendingInvitePolicyWorkflow(store: PendingInvitePolicyStore, clockValue: clock.Clock): PendingInvitePolicyWorkflow {
  return new PendingInvitePolicyWorkflow(
    store,
    defaultPendingInvitePolicyValidator(),
    clockValue,
    [],
    defaultPendingInvitePolicyEngine(),
  );
}
