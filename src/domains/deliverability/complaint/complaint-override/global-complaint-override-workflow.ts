import * as clock from "../../../../kit/clock.js";
import {
  GlobalComplaintOverrideValidator,
  defaultGlobalComplaintOverrideValidator,
} from "./global-complaint-override-rules.js";
import { GlobalComplaintOverrideStore } from "./global-complaint-override-store.js";

/** Moves global complaint overrides through their life cycle and keeps a journal of what it did. */
export class GlobalComplaintOverrideWorkflow {
  store: GlobalComplaintOverrideStore;
  validator: GlobalComplaintOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalComplaintOverrideStore,
    validator: GlobalComplaintOverrideValidator,
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
      throw new Error(`global complaint override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global complaint override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newGlobalComplaintOverrideWorkflow(store: GlobalComplaintOverrideStore, clockValue: clock.Clock): GlobalComplaintOverrideWorkflow {
  return new GlobalComplaintOverrideWorkflow(store, defaultGlobalComplaintOverrideValidator(), clockValue, []);
}
