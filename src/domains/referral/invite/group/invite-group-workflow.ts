import * as clock from "../../../../kit/clock.js";
import { InviteGroupEngine, defaultInviteGroupEngine } from "./invite-group-engine.js";
import { InviteGroupValidator, defaultInviteGroupValidator } from "./invite-group-rules.js";
import { InviteGroupStore } from "./invite-group-store.js";

/** Moves invite groups through their life cycle and keeps a journal of what it did. */
export class InviteGroupManager {
  store: InviteGroupStore;
  validator: InviteGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteGroupEngine;

  constructor(
    store: InviteGroupStore,
    validator: InviteGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteGroupEngine,
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
      throw new Error(`invite group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite group ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newInviteGroupManager(store: InviteGroupStore, clockValue: clock.Clock): InviteGroupManager {
  return new InviteGroupManager(store, defaultInviteGroupValidator(), clockValue, [], defaultInviteGroupEngine());
}
