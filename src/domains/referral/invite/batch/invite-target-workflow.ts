import * as clock from "../../../../kit/clock.js";
import { InviteTargetEngine, defaultInviteTargetEngine } from "./invite-target-engine.js";
import { InviteTargetValidator, defaultInviteTargetValidator } from "./invite-target-rules.js";
import { InviteTargetStore } from "./invite-target-store.js";

/** Moves invite targets through their life cycle and keeps a journal of what it did. */
export class InviteTargetManager {
  store: InviteTargetStore;
  validator: InviteTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteTargetEngine;

  constructor(
    store: InviteTargetStore,
    validator: InviteTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteTargetEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite target ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newInviteTargetManager(store: InviteTargetStore, clockValue: clock.Clock): InviteTargetManager {
  return new InviteTargetManager(store, defaultInviteTargetValidator(), clockValue, [], defaultInviteTargetEngine());
}
