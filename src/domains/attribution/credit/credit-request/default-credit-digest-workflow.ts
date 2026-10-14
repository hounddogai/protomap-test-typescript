import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultCreditDigestEngine, defaultDefaultCreditDigestEngine } from "./default-credit-digest-engine.js";
import { DefaultCreditDigestValidator, defaultDefaultCreditDigestValidator } from "./default-credit-digest-rules.js";
import { DefaultCreditDigestStore } from "./default-credit-digest-store.js";

/** Moves default credit digests through their life cycle and keeps a journal of what it did. */
export class DefaultCreditDigestService {
  store: DefaultCreditDigestStore;
  validator: DefaultCreditDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultCreditDigestEngine;

  constructor(
    store: DefaultCreditDigestStore,
    validator: DefaultCreditDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultCreditDigestEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default credit digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default credit digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default credit digest ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultCreditDigestService(store: DefaultCreditDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultCreditDigestService {
  return new DefaultCreditDigestService(
    store,
    defaultDefaultCreditDigestValidator(),
    clockValue,
    [],
    defaultDefaultCreditDigestEngine(flagsValue),
  );
}
