import * as clock from "../../../../kit/clock.js";
import { TieredSenderDigestEngine, defaultTieredSenderDigestEngine } from "./tiered-sender-digest-engine.js";
import { TieredSenderDigestValidator, defaultTieredSenderDigestValidator } from "./tiered-sender-digest-rules.js";
import { TieredSenderDigestStore } from "./tiered-sender-digest-store.js";

/** Moves tiered sender digests through their life cycle and keeps a journal of what it did. */
export class TieredSenderDigestService {
  store: TieredSenderDigestStore;
  validator: TieredSenderDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredSenderDigestEngine;

  constructor(
    store: TieredSenderDigestStore,
    validator: TieredSenderDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredSenderDigestEngine,
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
      throw new Error(`tiered sender digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered sender digest ${code} not found`);
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
      throw new Error(`tiered sender digest ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredSenderDigestService(store: TieredSenderDigestStore, clockValue: clock.Clock): TieredSenderDigestService {
  return new TieredSenderDigestService(
    store,
    defaultTieredSenderDigestValidator(),
    clockValue,
    [],
    defaultTieredSenderDigestEngine(),
  );
}
