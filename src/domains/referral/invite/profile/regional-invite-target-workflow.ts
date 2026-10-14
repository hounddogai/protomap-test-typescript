import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalInviteTargetEngine, defaultRegionalInviteTargetEngine } from "./regional-invite-target-engine.js";
import {
  RegionalInviteTargetValidator,
  defaultRegionalInviteTargetValidator,
} from "./regional-invite-target-rules.js";
import { RegionalInviteTargetStore } from "./regional-invite-target-store.js";

/** Moves regional invite targets through their life cycle and keeps a journal of what it did. */
export class RegionalInviteTargetDesk {
  store: RegionalInviteTargetStore;
  validator: RegionalInviteTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalInviteTargetEngine;

  constructor(
    store: RegionalInviteTargetStore,
    validator: RegionalInviteTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalInviteTargetEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional invite target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional invite target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional invite target ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRegionalInviteTargetDesk(store: RegionalInviteTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalInviteTargetDesk {
  return new RegionalInviteTargetDesk(
    store,
    defaultRegionalInviteTargetValidator(),
    clockValue,
    [],
    defaultRegionalInviteTargetEngine(flagsValue),
  );
}
