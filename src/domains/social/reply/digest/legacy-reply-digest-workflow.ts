import * as clock from "../../../../kit/clock.js";
import { LegacyReplyDigestEngine, defaultLegacyReplyDigestEngine } from "./legacy-reply-digest-engine.js";
import { LegacyReplyDigestValidator, defaultLegacyReplyDigestValidator } from "./legacy-reply-digest-rules.js";
import { LegacyReplyDigestStore } from "./legacy-reply-digest-store.js";

/** Moves legacy reply digests through their life cycle and keeps a journal of what it did. */
export class LegacyReplyDigestService {
  store: LegacyReplyDigestStore;
  validator: LegacyReplyDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyReplyDigestEngine;

  constructor(
    store: LegacyReplyDigestStore,
    validator: LegacyReplyDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyReplyDigestEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reply digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reply digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reply digest ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLegacyReplyDigestService(store: LegacyReplyDigestStore, clockValue: clock.Clock): LegacyReplyDigestService {
  return new LegacyReplyDigestService(
    store,
    defaultLegacyReplyDigestValidator(),
    clockValue,
    [],
    defaultLegacyReplyDigestEngine(),
  );
}
