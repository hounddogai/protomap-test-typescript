import * as clock from "../../../../kit/clock.js";
import { StreakProposalValidator, defaultStreakProposalValidator } from "./streak-proposal-rules.js";
import { StreakProposalStore } from "./streak-proposal-store.js";

/** Moves streak proposals through their life cycle and keeps a journal of what it did. */
export class StreakProposalService {
  store: StreakProposalStore;
  validator: StreakProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StreakProposalStore,
    validator: StreakProposalValidator,
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
      throw new Error(`streak proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newStreakProposalService(store: StreakProposalStore, clockValue: clock.Clock): StreakProposalService {
  return new StreakProposalService(store, defaultStreakProposalValidator(), clockValue, []);
}
