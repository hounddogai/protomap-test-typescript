import * as clock from "../../../../kit/clock.js";
import { ComplaintBatchValidator, defaultComplaintBatchValidator } from "./complaint-batch-rules.js";
import { ComplaintBatchStore } from "./complaint-batch-store.js";

/** Moves complaint batches through their life cycle and keeps a journal of what it did. */
export class ComplaintBatchWorkflow {
  store: ComplaintBatchStore;
  validator: ComplaintBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ComplaintBatchStore,
    validator: ComplaintBatchValidator,
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
      throw new Error(`complaint batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newComplaintBatchWorkflow(store: ComplaintBatchStore, clockValue: clock.Clock): ComplaintBatchWorkflow {
  return new ComplaintBatchWorkflow(store, defaultComplaintBatchValidator(), clockValue, []);
}
