import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedReplyQuotaEngine, defaultCappedReplyQuotaEngine } from "./capped-reply-quota-engine.js";
import { CappedReplyQuotaValidator, defaultCappedReplyQuotaValidator } from "./capped-reply-quota-rules.js";
import { CappedReplyQuotaStore } from "./capped-reply-quota-store.js";

/** Moves capped reply quotas through their life cycle and keeps a journal of what it did. */
export class CappedReplyQuotaCoordinator {
  store: CappedReplyQuotaStore;
  validator: CappedReplyQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedReplyQuotaEngine;

  constructor(
    store: CappedReplyQuotaStore,
    validator: CappedReplyQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedReplyQuotaEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reply quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reply quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reply quota ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newCappedReplyQuotaCoordinator(store: CappedReplyQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedReplyQuotaCoordinator {
  return new CappedReplyQuotaCoordinator(
    store,
    defaultCappedReplyQuotaValidator(),
    clockValue,
    [],
    defaultCappedReplyQuotaEngine(flagsValue),
  );
}
