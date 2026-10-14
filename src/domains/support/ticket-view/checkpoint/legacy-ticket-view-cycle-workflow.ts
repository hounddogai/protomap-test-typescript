import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyTicketViewCycleEngine,
  defaultLegacyTicketViewCycleEngine,
} from "./legacy-ticket-view-cycle-engine.js";
import {
  LegacyTicketViewCycleValidator,
  defaultLegacyTicketViewCycleValidator,
} from "./legacy-ticket-view-cycle-rules.js";
import { LegacyTicketViewCycleStore } from "./legacy-ticket-view-cycle-store.js";

/** Moves legacy ticket view cycles through their life cycle and keeps a journal of what it did. */
export class LegacyTicketViewCycleManager {
  store: LegacyTicketViewCycleStore;
  validator: LegacyTicketViewCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyTicketViewCycleEngine;

  constructor(
    store: LegacyTicketViewCycleStore,
    validator: LegacyTicketViewCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyTicketViewCycleEngine,
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
      throw new Error(`legacy ticket view cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view cycle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLegacyTicketViewCycleManager(store: LegacyTicketViewCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyTicketViewCycleManager {
  return new LegacyTicketViewCycleManager(
    store,
    defaultLegacyTicketViewCycleValidator(),
    clockValue,
    [],
    defaultLegacyTicketViewCycleEngine(flagsValue),
  );
}
