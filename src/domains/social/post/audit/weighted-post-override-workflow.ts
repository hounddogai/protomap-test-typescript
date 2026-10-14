import * as clock from "../../../../kit/clock.js";
import {
  WeightedPostOverrideValidator,
  defaultWeightedPostOverrideValidator,
} from "./weighted-post-override-rules.js";
import { WeightedPostOverrideStore } from "./weighted-post-override-store.js";

/** Moves weighted post overrides through their life cycle and keeps a journal of what it did. */
export class WeightedPostOverrideWorkflow {
  store: WeightedPostOverrideStore;
  validator: WeightedPostOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedPostOverrideStore,
    validator: WeightedPostOverrideValidator,
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
      throw new Error(`weighted post override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted post override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedPostOverrideWorkflow(store: WeightedPostOverrideStore, clockValue: clock.Clock): WeightedPostOverrideWorkflow {
  return new WeightedPostOverrideWorkflow(store, defaultWeightedPostOverrideValidator(), clockValue, []);
}
