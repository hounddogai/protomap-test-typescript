import * as clock from "../../../../kit/clock.js";
import { DefaultReplyDigestEngine, defaultDefaultReplyDigestEngine } from "./default-reply-digest-engine.js";
import { DefaultReplyDigestValidator, defaultDefaultReplyDigestValidator } from "./default-reply-digest-rules.js";
import { DefaultReplyDigestStore } from "./default-reply-digest-store.js";

/** Moves default reply digests through their life cycle and keeps a journal of what it did. */
export class DefaultReplyDigestService {
  store: DefaultReplyDigestStore;
  validator: DefaultReplyDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultReplyDigestEngine;

  constructor(
    store: DefaultReplyDigestStore,
    validator: DefaultReplyDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultReplyDigestEngine,
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
      throw new Error(`default reply digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reply digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reply digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newDefaultReplyDigestService(store: DefaultReplyDigestStore, clockValue: clock.Clock): DefaultReplyDigestService {
  return new DefaultReplyDigestService(
    store,
    defaultDefaultReplyDigestValidator(),
    clockValue,
    [],
    defaultDefaultReplyDigestEngine(),
  );
}
