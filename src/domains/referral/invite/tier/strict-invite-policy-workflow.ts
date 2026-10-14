import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictInvitePolicyEngine, defaultStrictInvitePolicyEngine } from "./strict-invite-policy-engine.js";
import { StrictInvitePolicyValidator, defaultStrictInvitePolicyValidator } from "./strict-invite-policy-rules.js";
import { StrictInvitePolicyStore } from "./strict-invite-policy-store.js";

/** Moves strict invite policies through their life cycle and keeps a journal of what it did. */
export class StrictInvitePolicyDesk {
  store: StrictInvitePolicyStore;
  validator: StrictInvitePolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictInvitePolicyEngine;

  constructor(
    store: StrictInvitePolicyStore,
    validator: StrictInvitePolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictInvitePolicyEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict invite policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict invite policy ${code} not found`);
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
      throw new Error(`strict invite policy ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStrictInvitePolicyDesk(store: StrictInvitePolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictInvitePolicyDesk {
  return new StrictInvitePolicyDesk(
    store,
    defaultStrictInvitePolicyValidator(),
    clockValue,
    [],
    defaultStrictInvitePolicyEngine(flagsValue),
  );
}
