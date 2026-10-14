import * as clock from "../../../../kit/clock.js";
import {
  RollingConversionPolicyValidator,
  defaultRollingConversionPolicyValidator,
} from "./rolling-conversion-policy-rules.js";
import { RollingConversionPolicyStore } from "./rolling-conversion-policy-store.js";

/** Moves rolling conversion policies through their life cycle and keeps a journal of what it did. */
export class RollingConversionPolicyService {
  store: RollingConversionPolicyStore;
  validator: RollingConversionPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingConversionPolicyStore,
    validator: RollingConversionPolicyValidator,
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
      throw new Error(`rolling conversion policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling conversion policy ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingConversionPolicyService(store: RollingConversionPolicyStore, clockValue: clock.Clock): RollingConversionPolicyService {
  return new RollingConversionPolicyService(store, defaultRollingConversionPolicyValidator(), clockValue, []);
}
