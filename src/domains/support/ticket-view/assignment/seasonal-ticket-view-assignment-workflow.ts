import * as clock from "../../../../kit/clock.js";
import {
  SeasonalTicketViewAssignmentValidator,
  defaultSeasonalTicketViewAssignmentValidator,
} from "./seasonal-ticket-view-assignment-rules.js";
import { SeasonalTicketViewAssignmentStore } from "./seasonal-ticket-view-assignment-store.js";

/** Moves seasonal ticket view assignments through their life cycle and keeps a journal of what it did. */
export class SeasonalTicketViewAssignmentWorkflow {
  store: SeasonalTicketViewAssignmentStore;
  validator: SeasonalTicketViewAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalTicketViewAssignmentStore,
    validator: SeasonalTicketViewAssignmentValidator,
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
      throw new Error(`seasonal ticket view assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal ticket view assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newSeasonalTicketViewAssignmentWorkflow(store: SeasonalTicketViewAssignmentStore, clockValue: clock.Clock): SeasonalTicketViewAssignmentWorkflow {
  return new SeasonalTicketViewAssignmentWorkflow(
    store,
    defaultSeasonalTicketViewAssignmentValidator(),
    clockValue,
    [],
  );
}
