import * as clock from "../../../../kit/clock.js";
import { LenientSenderDigestEngine, defaultLenientSenderDigestEngine } from "./lenient-sender-digest-engine.js";
import { LenientSenderDigestValidator, defaultLenientSenderDigestValidator } from "./lenient-sender-digest-rules.js";
import { LenientSenderDigestStore } from "./lenient-sender-digest-store.js";

/** Moves lenient sender digests through their life cycle and keeps a journal of what it did. */
export class LenientSenderDigestManager {
  store: LenientSenderDigestStore;
  validator: LenientSenderDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientSenderDigestEngine;

  constructor(
    store: LenientSenderDigestStore,
    validator: LenientSenderDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientSenderDigestEngine,
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
      throw new Error(`lenient sender digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient sender digest ${code} not found`);
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
      throw new Error(`lenient sender digest ${code} not found`);
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

export function newLenientSenderDigestManager(store: LenientSenderDigestStore, clockValue: clock.Clock): LenientSenderDigestManager {
  return new LenientSenderDigestManager(
    store,
    defaultLenientSenderDigestValidator(),
    clockValue,
    [],
    defaultLenientSenderDigestEngine(),
  );
}
