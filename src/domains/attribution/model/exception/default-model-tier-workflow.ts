import * as clock from "../../../../kit/clock.js";
import { DefaultModelTierValidator, defaultDefaultModelTierValidator } from "./default-model-tier-rules.js";
import { DefaultModelTierStore } from "./default-model-tier-store.js";

/** Moves default model tiers through their life cycle and keeps a journal of what it did. */
export class DefaultModelTierWorkflow {
  store: DefaultModelTierStore;
  validator: DefaultModelTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultModelTierStore,
    validator: DefaultModelTierValidator,
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
      throw new Error(`default model tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default model tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newDefaultModelTierWorkflow(store: DefaultModelTierStore, clockValue: clock.Clock): DefaultModelTierWorkflow {
  return new DefaultModelTierWorkflow(store, defaultDefaultModelTierValidator(), clockValue, []);
}
