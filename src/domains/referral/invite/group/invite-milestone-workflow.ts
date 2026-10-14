import * as clock from "../../../../kit/clock.js";
import { InviteMilestoneValidator, defaultInviteMilestoneValidator } from "./invite-milestone-rules.js";
import { InviteMilestoneStore } from "./invite-milestone-store.js";

/** Moves invite milestones through their life cycle and keeps a journal of what it did. */
export class InviteMilestoneService {
  store: InviteMilestoneStore;
  validator: InviteMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: InviteMilestoneStore,
    validator: InviteMilestoneValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newInviteMilestoneService(store: InviteMilestoneStore, clockValue: clock.Clock): InviteMilestoneService {
  return new InviteMilestoneService(store, defaultInviteMilestoneValidator(), clockValue, []);
}
