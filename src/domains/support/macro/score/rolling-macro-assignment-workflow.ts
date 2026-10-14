import * as clock from "../../../../kit/clock.js";
import {
  RollingMacroAssignmentValidator,
  defaultRollingMacroAssignmentValidator,
} from "./rolling-macro-assignment-rules.js";
import { RollingMacroAssignmentStore } from "./rolling-macro-assignment-store.js";

/** Moves rolling macro assignments through their life cycle and keeps a journal of what it did. */
export class RollingMacroAssignmentWorkflow {
  store: RollingMacroAssignmentStore;
  validator: RollingMacroAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingMacroAssignmentStore,
    validator: RollingMacroAssignmentValidator,
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
      throw new Error(`rolling macro assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling macro assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newRollingMacroAssignmentWorkflow(store: RollingMacroAssignmentStore, clockValue: clock.Clock): RollingMacroAssignmentWorkflow {
  return new RollingMacroAssignmentWorkflow(store, defaultRollingMacroAssignmentValidator(), clockValue, []);
}
