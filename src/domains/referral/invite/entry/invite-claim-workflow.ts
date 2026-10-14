import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InviteClaimEngine, defaultInviteClaimEngine } from "./invite-claim-engine.js";
import { InviteClaimValidator, defaultInviteClaimValidator } from "./invite-claim-rules.js";
import { InviteClaimStore } from "./invite-claim-store.js";

/** Moves invite claims through their life cycle and keeps a journal of what it did. */
export class InviteClaimDesk {
  store: InviteClaimStore;
  validator: InviteClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteClaimEngine;

  constructor(
    store: InviteClaimStore,
    validator: InviteClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteClaimEngine,
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
      throw new Error(`invite claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newInviteClaimDesk(store: InviteClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): InviteClaimDesk {
  return new InviteClaimDesk(
    store,
    defaultInviteClaimValidator(),
    clockValue,
    [],
    defaultInviteClaimEngine(flagsValue),
  );
}
