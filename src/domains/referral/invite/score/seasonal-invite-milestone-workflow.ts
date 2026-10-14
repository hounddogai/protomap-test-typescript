import * as clock from "../../../../kit/clock.js";
import {
  SeasonalInviteMilestoneEngine,
  defaultSeasonalInviteMilestoneEngine,
} from "./seasonal-invite-milestone-engine.js";
import {
  SeasonalInviteMilestoneValidator,
  defaultSeasonalInviteMilestoneValidator,
} from "./seasonal-invite-milestone-rules.js";
import { SeasonalInviteMilestoneStore } from "./seasonal-invite-milestone-store.js";

/** Moves seasonal invite milestones through their life cycle and keeps a journal of what it did. */
export class SeasonalInviteMilestoneWorkflow {
  store: SeasonalInviteMilestoneStore;
  validator: SeasonalInviteMilestoneValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalInviteMilestoneEngine;

  constructor(
    store: SeasonalInviteMilestoneStore,
    validator: SeasonalInviteMilestoneValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalInviteMilestoneEngine,
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
      throw new Error(`seasonal invite milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal invite milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal invite milestone ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalInviteMilestoneWorkflow(store: SeasonalInviteMilestoneStore, clockValue: clock.Clock): SeasonalInviteMilestoneWorkflow {
  return new SeasonalInviteMilestoneWorkflow(
    store,
    defaultSeasonalInviteMilestoneValidator(),
    clockValue,
    [],
    defaultSeasonalInviteMilestoneEngine(),
  );
}
