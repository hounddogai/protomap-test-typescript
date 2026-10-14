import * as clock from "../../../../kit/clock.js";
import { StepReviewValidator, defaultStepReviewValidator } from "./step-review-rules.js";
import { StepReviewStore } from "./step-review-store.js";

/** Moves step reviews through their life cycle and keeps a journal of what it did. */
export class StepReviewWorkflow {
  store: StepReviewStore;
  validator: StepReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: StepReviewStore, validator: StepReviewValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`step review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`step review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newStepReviewWorkflow(store: StepReviewStore, clockValue: clock.Clock): StepReviewWorkflow {
  return new StepReviewWorkflow(store, defaultStepReviewValidator(), clockValue, []);
}
