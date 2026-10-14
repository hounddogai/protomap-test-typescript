import * as clock from "../../../../kit/clock.js";
import {
  DefaultSuppressionEstimateValidator,
  defaultDefaultSuppressionEstimateValidator,
} from "./default-suppression-estimate-rules.js";
import { DefaultSuppressionEstimateStore } from "./default-suppression-estimate-store.js";

/** Moves default suppression estimates through their life cycle and keeps a journal of what it did. */
export class DefaultSuppressionEstimateWorkflow {
  store: DefaultSuppressionEstimateStore;
  validator: DefaultSuppressionEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultSuppressionEstimateStore,
    validator: DefaultSuppressionEstimateValidator,
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
      throw new Error(`default suppression estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default suppression estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultSuppressionEstimateWorkflow(store: DefaultSuppressionEstimateStore, clockValue: clock.Clock): DefaultSuppressionEstimateWorkflow {
  return new DefaultSuppressionEstimateWorkflow(store, defaultDefaultSuppressionEstimateValidator(), clockValue, []);
}
