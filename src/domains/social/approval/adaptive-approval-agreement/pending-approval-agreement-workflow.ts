import * as clock from "../../../../kit/clock.js";
import {
  PendingApprovalAgreementValidator,
  defaultPendingApprovalAgreementValidator,
} from "./pending-approval-agreement-rules.js";
import { PendingApprovalAgreementStore } from "./pending-approval-agreement-store.js";

/** Moves pending approval agreements through their life cycle and keeps a journal of what it did. */
export class PendingApprovalAgreementService {
  store: PendingApprovalAgreementStore;
  validator: PendingApprovalAgreementValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingApprovalAgreementStore,
    validator: PendingApprovalAgreementValidator,
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
      throw new Error(`pending approval agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending approval agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newPendingApprovalAgreementService(store: PendingApprovalAgreementStore, clockValue: clock.Clock): PendingApprovalAgreementService {
  return new PendingApprovalAgreementService(store, defaultPendingApprovalAgreementValidator(), clockValue, []);
}
