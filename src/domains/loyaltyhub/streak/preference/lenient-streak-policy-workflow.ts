import * as clock from "../../../../kit/clock.js";
import { LenientStreakPolicyValidator, defaultLenientStreakPolicyValidator } from "./lenient-streak-policy-rules.js";
import { LenientStreakPolicyStore } from "./lenient-streak-policy-store.js";

/** Moves lenient streak policies through their life cycle and keeps a journal of what it did. */
export class LenientStreakPolicyService {
  store: LenientStreakPolicyStore;
  validator: LenientStreakPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientStreakPolicyStore,
    validator: LenientStreakPolicyValidator,
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
      throw new Error(`lenient streak policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient streak policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newLenientStreakPolicyService(store: LenientStreakPolicyStore, clockValue: clock.Clock): LenientStreakPolicyService {
  return new LenientStreakPolicyService(store, defaultLenientStreakPolicyValidator(), clockValue, []);
}
