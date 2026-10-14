import * as clock from "../../../../kit/clock.js";
import { ScheduledCreditBundleEngine, defaultScheduledCreditBundleEngine } from "./scheduled-credit-bundle-engine.js";
import {
  ScheduledCreditBundleValidator,
  defaultScheduledCreditBundleValidator,
} from "./scheduled-credit-bundle-rules.js";
import { ScheduledCreditBundleStore } from "./scheduled-credit-bundle-store.js";

/** Moves scheduled credit bundles through their life cycle and keeps a journal of what it did. */
export class ScheduledCreditBundleManager {
  store: ScheduledCreditBundleStore;
  validator: ScheduledCreditBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledCreditBundleEngine;

  constructor(
    store: ScheduledCreditBundleStore,
    validator: ScheduledCreditBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledCreditBundleEngine,
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
      throw new Error(`scheduled credit bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled credit bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled credit bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newScheduledCreditBundleManager(store: ScheduledCreditBundleStore, clockValue: clock.Clock): ScheduledCreditBundleManager {
  return new ScheduledCreditBundleManager(
    store,
    defaultScheduledCreditBundleValidator(),
    clockValue,
    [],
    defaultScheduledCreditBundleEngine(),
  );
}
