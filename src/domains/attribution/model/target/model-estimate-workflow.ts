import * as clock from "../../../../kit/clock.js";
import { ModelEstimateValidator, defaultModelEstimateValidator } from "./model-estimate-rules.js";
import { ModelEstimateStore } from "./model-estimate-store.js";

/** Moves model estimates through their life cycle and keeps a journal of what it did. */
export class ModelEstimateManager {
  store: ModelEstimateStore;
  validator: ModelEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ModelEstimateStore,
    validator: ModelEstimateValidator,
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
      throw new Error(`model estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newModelEstimateManager(store: ModelEstimateStore, clockValue: clock.Clock): ModelEstimateManager {
  return new ModelEstimateManager(store, defaultModelEstimateValidator(), clockValue, []);
}
