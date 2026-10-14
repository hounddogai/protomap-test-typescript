import * as clock from "../../../../kit/clock.js";
import {
  LegacyModelMilestoneValidator,
  defaultLegacyModelMilestoneValidator,
} from "./legacy-model-milestone-rules.js";
import { LegacyModelMilestoneStore } from "./legacy-model-milestone-store.js";

/** Moves legacy model milestones through their life cycle and keeps a journal of what it did. */
export class LegacyModelMilestoneService {
  store: LegacyModelMilestoneStore;
  validator: LegacyModelMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyModelMilestoneStore,
    validator: LegacyModelMilestoneValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy model milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy model milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newLegacyModelMilestoneService(store: LegacyModelMilestoneStore, clockValue: clock.Clock): LegacyModelMilestoneService {
  return new LegacyModelMilestoneService(store, defaultLegacyModelMilestoneValidator(), clockValue, []);
}
