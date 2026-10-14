import * as clock from "../../../../kit/clock.js";
import {
  DefaultComplaintBatchValidator,
  defaultDefaultComplaintBatchValidator,
} from "./default-complaint-batch-rules.js";
import { DefaultComplaintBatchStore } from "./default-complaint-batch-store.js";

/** Moves default complaint batches through their life cycle and keeps a journal of what it did. */
export class DefaultComplaintBatchService {
  store: DefaultComplaintBatchStore;
  validator: DefaultComplaintBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultComplaintBatchStore,
    validator: DefaultComplaintBatchValidator,
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
      throw new Error(`default complaint batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default complaint batch ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultComplaintBatchService(store: DefaultComplaintBatchStore, clockValue: clock.Clock): DefaultComplaintBatchService {
  return new DefaultComplaintBatchService(store, defaultDefaultComplaintBatchValidator(), clockValue, []);
}
