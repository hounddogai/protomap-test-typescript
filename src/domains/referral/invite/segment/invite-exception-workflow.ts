import * as clock from "../../../../kit/clock.js";
import { InviteExceptionEngine, defaultInviteExceptionEngine } from "./invite-exception-engine.js";
import { InviteExceptionValidator, defaultInviteExceptionValidator } from "./invite-exception-rules.js";
import { InviteExceptionStore } from "./invite-exception-store.js";

/** Moves invite exceptions through their life cycle and keeps a journal of what it did. */
export class InviteExceptionManager {
  store: InviteExceptionStore;
  validator: InviteExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteExceptionEngine;

  constructor(
    store: InviteExceptionStore,
    validator: InviteExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteExceptionEngine,
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
      throw new Error(`invite exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite exception ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newInviteExceptionManager(store: InviteExceptionStore, clockValue: clock.Clock): InviteExceptionManager {
  return new InviteExceptionManager(
    store,
    defaultInviteExceptionValidator(),
    clockValue,
    [],
    defaultInviteExceptionEngine(),
  );
}
