import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientDeflectionRequestEngine,
  defaultLenientDeflectionRequestEngine,
} from "./lenient-deflection-request-engine.js";
import {
  LenientDeflectionRequestValidator,
  defaultLenientDeflectionRequestValidator,
} from "./lenient-deflection-request-rules.js";
import { LenientDeflectionRequestStore } from "./lenient-deflection-request-store.js";

/** Moves lenient deflection requests through their life cycle and keeps a journal of what it did. */
export class LenientDeflectionRequestService {
  store: LenientDeflectionRequestStore;
  validator: LenientDeflectionRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientDeflectionRequestEngine;

  constructor(
    store: LenientDeflectionRequestStore,
    validator: LenientDeflectionRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientDeflectionRequestEngine,
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
      throw new Error(`lenient deflection request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient deflection request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient deflection request ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newLenientDeflectionRequestService(store: LenientDeflectionRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientDeflectionRequestService {
  return new LenientDeflectionRequestService(
    store,
    defaultLenientDeflectionRequestValidator(),
    clockValue,
    [],
    defaultLenientDeflectionRequestEngine(flagsValue),
  );
}
