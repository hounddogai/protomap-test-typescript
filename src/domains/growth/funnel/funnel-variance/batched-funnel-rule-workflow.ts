import * as clock from "../../../../kit/clock.js";
import { BatchedFunnelRuleValidator, defaultBatchedFunnelRuleValidator } from "./batched-funnel-rule-rules.js";
import { BatchedFunnelRuleStore } from "./batched-funnel-rule-store.js";

/** Moves batched funnel rules through their life cycle and keeps a journal of what it did. */
export class BatchedFunnelRuleCoordinator {
  store: BatchedFunnelRuleStore;
  validator: BatchedFunnelRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedFunnelRuleStore,
    validator: BatchedFunnelRuleValidator,
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
      throw new Error(`batched funnel rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched funnel rule ${code} not found`);
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

export function newBatchedFunnelRuleCoordinator(store: BatchedFunnelRuleStore, clockValue: clock.Clock): BatchedFunnelRuleCoordinator {
  return new BatchedFunnelRuleCoordinator(store, defaultBatchedFunnelRuleValidator(), clockValue, []);
}
