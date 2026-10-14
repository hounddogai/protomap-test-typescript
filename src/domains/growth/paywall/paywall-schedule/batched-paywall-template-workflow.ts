import * as clock from "../../../../kit/clock.js";
import {
  BatchedPaywallTemplateEngine,
  defaultBatchedPaywallTemplateEngine,
} from "./batched-paywall-template-engine.js";
import {
  BatchedPaywallTemplateValidator,
  defaultBatchedPaywallTemplateValidator,
} from "./batched-paywall-template-rules.js";
import { BatchedPaywallTemplateStore } from "./batched-paywall-template-store.js";

/** Moves batched paywall templates through their life cycle and keeps a journal of what it did. */
export class BatchedPaywallTemplateCoordinator {
  store: BatchedPaywallTemplateStore;
  validator: BatchedPaywallTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPaywallTemplateEngine;

  constructor(
    store: BatchedPaywallTemplateStore,
    validator: BatchedPaywallTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPaywallTemplateEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched paywall template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched paywall template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched paywall template ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedPaywallTemplateCoordinator(store: BatchedPaywallTemplateStore, clockValue: clock.Clock): BatchedPaywallTemplateCoordinator {
  return new BatchedPaywallTemplateCoordinator(
    store,
    defaultBatchedPaywallTemplateValidator(),
    clockValue,
    [],
    defaultBatchedPaywallTemplateEngine(),
  );
}
