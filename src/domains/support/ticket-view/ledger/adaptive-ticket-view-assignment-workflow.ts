import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveTicketViewAssignmentEngine,
  defaultAdaptiveTicketViewAssignmentEngine,
} from "./adaptive-ticket-view-assignment-engine.js";
import {
  AdaptiveTicketViewAssignmentValidator,
  defaultAdaptiveTicketViewAssignmentValidator,
} from "./adaptive-ticket-view-assignment-rules.js";
import { AdaptiveTicketViewAssignmentStore } from "./adaptive-ticket-view-assignment-store.js";

/** Moves adaptive ticket view assignments through their life cycle and keeps a journal of what it did. */
export class AdaptiveTicketViewAssignmentDesk {
  store: AdaptiveTicketViewAssignmentStore;
  validator: AdaptiveTicketViewAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveTicketViewAssignmentEngine;

  constructor(
    store: AdaptiveTicketViewAssignmentStore,
    validator: AdaptiveTicketViewAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveTicketViewAssignmentEngine,
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
      throw new Error(`adaptive ticket view assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive ticket view assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive ticket view assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newAdaptiveTicketViewAssignmentDesk(store: AdaptiveTicketViewAssignmentStore, clockValue: clock.Clock): AdaptiveTicketViewAssignmentDesk {
  return new AdaptiveTicketViewAssignmentDesk(
    store,
    defaultAdaptiveTicketViewAssignmentValidator(),
    clockValue,
    [],
    defaultAdaptiveTicketViewAssignmentEngine(),
  );
}
