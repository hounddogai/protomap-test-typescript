import * as clock from "../../../../kit/clock.js";
import { LegacyDomainPolicyValidator, defaultLegacyDomainPolicyValidator } from "./legacy-domain-policy-rules.js";
import { LegacyDomainPolicyStore } from "./legacy-domain-policy-store.js";

/** Moves legacy domain policies through their life cycle and keeps a journal of what it did. */
export class LegacyDomainPolicyManager {
  store: LegacyDomainPolicyStore;
  validator: LegacyDomainPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyDomainPolicyStore,
    validator: LegacyDomainPolicyValidator,
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
      throw new Error(`legacy domain policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy domain policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newLegacyDomainPolicyManager(store: LegacyDomainPolicyStore, clockValue: clock.Clock): LegacyDomainPolicyManager {
  return new LegacyDomainPolicyManager(store, defaultLegacyDomainPolicyValidator(), clockValue, []);
}
