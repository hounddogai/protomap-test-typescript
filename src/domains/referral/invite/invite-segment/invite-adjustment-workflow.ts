import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InviteAdjustmentEngine, defaultInviteAdjustmentEngine } from "./invite-adjustment-engine.js";
import { InviteAdjustmentValidator, defaultInviteAdjustmentValidator } from "./invite-adjustment-rules.js";
import { InviteAdjustmentStore } from "./invite-adjustment-store.js";

/** Moves invite adjustments through their life cycle and keeps a journal of what it did. */
export class InviteAdjustmentDesk {
  store: InviteAdjustmentStore;
  validator: InviteAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteAdjustmentEngine;

  constructor(
    store: InviteAdjustmentStore,
    validator: InviteAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteAdjustmentEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInviteAdjustmentDesk(store: InviteAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): InviteAdjustmentDesk {
  return new InviteAdjustmentDesk(
    store,
    defaultInviteAdjustmentValidator(),
    clockValue,
    [],
    defaultInviteAdjustmentEngine(flagsValue),
  );
}
