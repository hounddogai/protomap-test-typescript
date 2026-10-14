import * as clock from "../../../../kit/clock.js";
import { CappedStepVarianceValidator, defaultCappedStepVarianceValidator } from "./capped-step-variance-rules.js";
import { CappedStepVarianceStore } from "./capped-step-variance-store.js";

/** Moves capped step variances through their life cycle and keeps a journal of what it did. */
export class CappedStepVarianceWorkflow {
  store: CappedStepVarianceStore;
  validator: CappedStepVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedStepVarianceStore,
    validator: CappedStepVarianceValidator,
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
      throw new Error(`capped step variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped step variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedStepVarianceWorkflow(store: CappedStepVarianceStore, clockValue: clock.Clock): CappedStepVarianceWorkflow {
  return new CappedStepVarianceWorkflow(store, defaultCappedStepVarianceValidator(), clockValue, []);
}
