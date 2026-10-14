import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TierDigestEngine, defaultTierDigestEngine } from "./tier-digest-engine.js";
import { TierDigestValidator, defaultTierDigestValidator } from "./tier-digest-rules.js";
import { TierDigestStore } from "./tier-digest-store.js";

/** Moves tier digests through their life cycle and keeps a journal of what it did. */
export class TierDigestDesk {
  store: TierDigestStore;
  validator: TierDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierDigestEngine;

  constructor(
    store: TierDigestStore,
    validator: TierDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierDigestEngine,
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
      throw new Error(`tier digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier digest ${code} not found`);
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

export function newTierDigestDesk(store: TierDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): TierDigestDesk {
  return new TierDigestDesk(store, defaultTierDigestValidator(), clockValue, [], defaultTierDigestEngine(flagsValue));
}
