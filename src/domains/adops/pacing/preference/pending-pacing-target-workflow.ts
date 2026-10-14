import * as clock from "../../../../kit/clock.js";
import { PendingPacingTargetValidator, defaultPendingPacingTargetValidator } from "./pending-pacing-target-rules.js";
import { PendingPacingTargetStore } from "./pending-pacing-target-store.js";

/** Moves pending pacing targets through their life cycle and keeps a journal of what it did. */
export class PendingPacingTargetDesk {
  store: PendingPacingTargetStore;
  validator: PendingPacingTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingPacingTargetStore,
    validator: PendingPacingTargetValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending pacing target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending pacing target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newPendingPacingTargetDesk(store: PendingPacingTargetStore, clockValue: clock.Clock): PendingPacingTargetDesk {
  return new PendingPacingTargetDesk(store, defaultPendingPacingTargetValidator(), clockValue, []);
}
