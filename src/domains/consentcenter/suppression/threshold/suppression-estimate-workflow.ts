import * as clock from "../../../../kit/clock.js";
import { SuppressionEstimateValidator, defaultSuppressionEstimateValidator } from "./suppression-estimate-rules.js";
import { SuppressionEstimateStore } from "./suppression-estimate-store.js";

/** Moves suppression estimates through their life cycle and keeps a journal of what it did. */
export class SuppressionEstimateDesk {
  store: SuppressionEstimateStore;
  validator: SuppressionEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SuppressionEstimateStore,
    validator: SuppressionEstimateValidator,
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
      throw new Error(`suppression estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression estimate ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSuppressionEstimateDesk(store: SuppressionEstimateStore, clockValue: clock.Clock): SuppressionEstimateDesk {
  return new SuppressionEstimateDesk(store, defaultSuppressionEstimateValidator(), clockValue, []);
}
