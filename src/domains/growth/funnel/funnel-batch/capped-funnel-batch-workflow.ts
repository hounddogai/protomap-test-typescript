import * as clock from "../../../../kit/clock.js";
import { CappedFunnelBatchValidator, defaultCappedFunnelBatchValidator } from "./capped-funnel-batch-rules.js";
import { CappedFunnelBatchStore } from "./capped-funnel-batch-store.js";

/** Moves capped funnel batches through their life cycle and keeps a journal of what it did. */
export class CappedFunnelBatchManager {
  store: CappedFunnelBatchStore;
  validator: CappedFunnelBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFunnelBatchStore,
    validator: CappedFunnelBatchValidator,
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
      throw new Error(`capped funnel batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped funnel batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newCappedFunnelBatchManager(store: CappedFunnelBatchStore, clockValue: clock.Clock): CappedFunnelBatchManager {
  return new CappedFunnelBatchManager(store, defaultCappedFunnelBatchValidator(), clockValue, []);
}
