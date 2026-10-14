import * as clock from "../../../../kit/clock.js";
import {
  PrimaryComplaintPolicyEngine,
  defaultPrimaryComplaintPolicyEngine,
} from "./primary-complaint-policy-engine.js";
import {
  PrimaryComplaintPolicyValidator,
  defaultPrimaryComplaintPolicyValidator,
} from "./primary-complaint-policy-rules.js";
import { PrimaryComplaintPolicyStore } from "./primary-complaint-policy-store.js";

/** Moves primary complaint policies through their life cycle and keeps a journal of what it did. */
export class PrimaryComplaintPolicyDesk {
  store: PrimaryComplaintPolicyStore;
  validator: PrimaryComplaintPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryComplaintPolicyEngine;

  constructor(
    store: PrimaryComplaintPolicyStore,
    validator: PrimaryComplaintPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryComplaintPolicyEngine,
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
      throw new Error(`primary complaint policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary complaint policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary complaint policy ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryComplaintPolicyDesk(store: PrimaryComplaintPolicyStore, clockValue: clock.Clock): PrimaryComplaintPolicyDesk {
  return new PrimaryComplaintPolicyDesk(
    store,
    defaultPrimaryComplaintPolicyValidator(),
    clockValue,
    [],
    defaultPrimaryComplaintPolicyEngine(),
  );
}
