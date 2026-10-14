import * as clock from "../../../../kit/clock.js";
import {
  WeightedEscalationDraftValidator,
  defaultWeightedEscalationDraftValidator,
} from "./weighted-escalation-draft-rules.js";
import { WeightedEscalationDraftStore } from "./weighted-escalation-draft-store.js";

/** Moves weighted escalation drafts through their life cycle and keeps a journal of what it did. */
export class WeightedEscalationDraftWorkflow {
  store: WeightedEscalationDraftStore;
  validator: WeightedEscalationDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedEscalationDraftStore,
    validator: WeightedEscalationDraftValidator,
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
      throw new Error(`weighted escalation draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted escalation draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newWeightedEscalationDraftWorkflow(store: WeightedEscalationDraftStore, clockValue: clock.Clock): WeightedEscalationDraftWorkflow {
  return new WeightedEscalationDraftWorkflow(store, defaultWeightedEscalationDraftValidator(), clockValue, []);
}
