import * as clock from "../../../../kit/clock.js";
import {
  PrimaryEscalationAdjustmentValidator,
  defaultPrimaryEscalationAdjustmentValidator,
} from "./primary-escalation-adjustment-rules.js";
import { PrimaryEscalationAdjustmentStore } from "./primary-escalation-adjustment-store.js";

/** Moves primary escalation adjustments through their life cycle and keeps a journal of what it did. */
export class PrimaryEscalationAdjustmentManager {
  store: PrimaryEscalationAdjustmentStore;
  validator: PrimaryEscalationAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryEscalationAdjustmentStore,
    validator: PrimaryEscalationAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newPrimaryEscalationAdjustmentManager(store: PrimaryEscalationAdjustmentStore, clockValue: clock.Clock): PrimaryEscalationAdjustmentManager {
  return new PrimaryEscalationAdjustmentManager(store, defaultPrimaryEscalationAdjustmentValidator(), clockValue, []);
}
