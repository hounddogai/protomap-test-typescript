import * as clock from "../../../../kit/clock.js";
import { PrimaryInviteRecordEngine, defaultPrimaryInviteRecordEngine } from "./primary-invite-record-engine.js";
import { PrimaryInviteRecordValidator, defaultPrimaryInviteRecordValidator } from "./primary-invite-record-rules.js";
import { PrimaryInviteRecordStore } from "./primary-invite-record-store.js";

/** Moves primary invite records through their life cycle and keeps a journal of what it did. */
export class PrimaryInviteRecordDesk {
  store: PrimaryInviteRecordStore;
  validator: PrimaryInviteRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryInviteRecordEngine;

  constructor(
    store: PrimaryInviteRecordStore,
    validator: PrimaryInviteRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryInviteRecordEngine,
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
      throw new Error(`primary invite record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary invite record ${code} not found`);
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
      throw new Error(`primary invite record ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryInviteRecordDesk(store: PrimaryInviteRecordStore, clockValue: clock.Clock): PrimaryInviteRecordDesk {
  return new PrimaryInviteRecordDesk(
    store,
    defaultPrimaryInviteRecordValidator(),
    clockValue,
    [],
    defaultPrimaryInviteRecordEngine(),
  );
}
