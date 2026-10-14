import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientMentionClaimEngine, defaultLenientMentionClaimEngine } from "./lenient-mention-claim-engine.js";
import { LenientMentionClaimValidator, defaultLenientMentionClaimValidator } from "./lenient-mention-claim-rules.js";
import { LenientMentionClaimStore } from "./lenient-mention-claim-store.js";

/** Moves lenient mention claims through their life cycle and keeps a journal of what it did. */
export class LenientMentionClaimManager {
  store: LenientMentionClaimStore;
  validator: LenientMentionClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientMentionClaimEngine;

  constructor(
    store: LenientMentionClaimStore,
    validator: LenientMentionClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientMentionClaimEngine,
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
      throw new Error(`lenient mention claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient mention claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient mention claim ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLenientMentionClaimManager(store: LenientMentionClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientMentionClaimManager {
  return new LenientMentionClaimManager(
    store,
    defaultLenientMentionClaimValidator(),
    clockValue,
    [],
    defaultLenientMentionClaimEngine(flagsValue),
  );
}
