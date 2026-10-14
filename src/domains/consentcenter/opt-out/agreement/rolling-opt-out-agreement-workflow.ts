import * as clock from "../../../../kit/clock.js";
import {
  RollingOptOutAgreementValidator,
  defaultRollingOptOutAgreementValidator,
} from "./rolling-opt-out-agreement-rules.js";
import { RollingOptOutAgreementStore } from "./rolling-opt-out-agreement-store.js";

/** Moves rolling opt out agreements through their life cycle and keeps a journal of what it did. */
export class RollingOptOutAgreementCoordinator {
  store: RollingOptOutAgreementStore;
  validator: RollingOptOutAgreementValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingOptOutAgreementStore,
    validator: RollingOptOutAgreementValidator,
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
      throw new Error(`rolling opt out agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling opt out agreement ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingOptOutAgreementCoordinator(store: RollingOptOutAgreementStore, clockValue: clock.Clock): RollingOptOutAgreementCoordinator {
  return new RollingOptOutAgreementCoordinator(store, defaultRollingOptOutAgreementValidator(), clockValue, []);
}
