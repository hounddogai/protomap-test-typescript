import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalSenderRequestEngine, defaultGlobalSenderRequestEngine } from "./global-sender-request-engine.js";
import { GlobalSenderRequestValidator, defaultGlobalSenderRequestValidator } from "./global-sender-request-rules.js";
import { GlobalSenderRequestStore } from "./global-sender-request-store.js";

/** Moves global sender requests through their life cycle and keeps a journal of what it did. */
export class GlobalSenderRequestService {
  store: GlobalSenderRequestStore;
  validator: GlobalSenderRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalSenderRequestEngine;

  constructor(
    store: GlobalSenderRequestStore,
    validator: GlobalSenderRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalSenderRequestEngine,
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
      throw new Error(`global sender request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global sender request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global sender request ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newGlobalSenderRequestService(store: GlobalSenderRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalSenderRequestService {
  return new GlobalSenderRequestService(
    store,
    defaultGlobalSenderRequestValidator(),
    clockValue,
    [],
    defaultGlobalSenderRequestEngine(flagsValue),
  );
}
