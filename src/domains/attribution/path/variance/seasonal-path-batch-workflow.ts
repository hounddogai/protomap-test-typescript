import * as clock from "../../../../kit/clock.js";
import { SeasonalPathBatchValidator, defaultSeasonalPathBatchValidator } from "./seasonal-path-batch-rules.js";
import { SeasonalPathBatchStore } from "./seasonal-path-batch-store.js";

/** Moves seasonal path batches through their life cycle and keeps a journal of what it did. */
export class SeasonalPathBatchService {
  store: SeasonalPathBatchStore;
  validator: SeasonalPathBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalPathBatchStore,
    validator: SeasonalPathBatchValidator,
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
      throw new Error(`seasonal path batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal path batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newSeasonalPathBatchService(store: SeasonalPathBatchStore, clockValue: clock.Clock): SeasonalPathBatchService {
  return new SeasonalPathBatchService(store, defaultSeasonalPathBatchValidator(), clockValue, []);
}
