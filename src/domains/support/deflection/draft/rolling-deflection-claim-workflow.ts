import * as clock from "../../../../kit/clock.js";
import {
  RollingDeflectionClaimValidator,
  defaultRollingDeflectionClaimValidator,
} from "./rolling-deflection-claim-rules.js";
import { RollingDeflectionClaimStore } from "./rolling-deflection-claim-store.js";

/** Moves rolling deflection claims through their life cycle and keeps a journal of what it did. */
export class RollingDeflectionClaimDesk {
  store: RollingDeflectionClaimStore;
  validator: RollingDeflectionClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingDeflectionClaimStore,
    validator: RollingDeflectionClaimValidator,
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
      throw new Error(`rolling deflection claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling deflection claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newRollingDeflectionClaimDesk(store: RollingDeflectionClaimStore, clockValue: clock.Clock): RollingDeflectionClaimDesk {
  return new RollingDeflectionClaimDesk(store, defaultRollingDeflectionClaimValidator(), clockValue, []);
}
