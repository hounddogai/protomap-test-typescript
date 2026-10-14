import * as clock from "../../../../kit/clock.js";
import {
  ManualPacingExceptionValidator,
  defaultManualPacingExceptionValidator,
} from "./manual-pacing-exception-rules.js";
import { ManualPacingExceptionStore } from "./manual-pacing-exception-store.js";

/** Moves manual pacing exceptions through their life cycle and keeps a journal of what it did. */
export class ManualPacingExceptionWorkflow {
  store: ManualPacingExceptionStore;
  validator: ManualPacingExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualPacingExceptionStore,
    validator: ManualPacingExceptionValidator,
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
      throw new Error(`manual pacing exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual pacing exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualPacingExceptionWorkflow(store: ManualPacingExceptionStore, clockValue: clock.Clock): ManualPacingExceptionWorkflow {
  return new ManualPacingExceptionWorkflow(store, defaultManualPacingExceptionValidator(), clockValue, []);
}
