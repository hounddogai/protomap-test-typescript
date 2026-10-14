import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingInviteTierEngine, defaultRollingInviteTierEngine } from "./rolling-invite-tier-engine.js";
import { RollingInviteTierValidator, defaultRollingInviteTierValidator } from "./rolling-invite-tier-rules.js";
import { RollingInviteTierStore } from "./rolling-invite-tier-store.js";

/** Moves rolling invite tiers through their life cycle and keeps a journal of what it did. */
export class RollingInviteTierService {
  store: RollingInviteTierStore;
  validator: RollingInviteTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingInviteTierEngine;

  constructor(
    store: RollingInviteTierStore,
    validator: RollingInviteTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingInviteTierEngine,
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
      throw new Error(`rolling invite tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling invite tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling invite tier ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingInviteTierService(store: RollingInviteTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingInviteTierService {
  return new RollingInviteTierService(
    store,
    defaultRollingInviteTierValidator(),
    clockValue,
    [],
    defaultRollingInviteTierEngine(flagsValue),
  );
}
