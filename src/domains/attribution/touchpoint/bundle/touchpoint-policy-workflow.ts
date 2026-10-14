import * as clock from "../../../../kit/clock.js";
import { TouchpointPolicyValidator, defaultTouchpointPolicyValidator } from "./touchpoint-policy-rules.js";
import { TouchpointPolicyStore } from "./touchpoint-policy-store.js";

/** Moves touchpoint policies through their life cycle and keeps a journal of what it did. */
export class TouchpointPolicyDesk {
  store: TouchpointPolicyStore;
  validator: TouchpointPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TouchpointPolicyStore,
    validator: TouchpointPolicyValidator,
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
      throw new Error(`touchpoint policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newTouchpointPolicyDesk(store: TouchpointPolicyStore, clockValue: clock.Clock): TouchpointPolicyDesk {
  return new TouchpointPolicyDesk(store, defaultTouchpointPolicyValidator(), clockValue, []);
}
