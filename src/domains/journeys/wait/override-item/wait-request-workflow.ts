import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WaitRequestEngine, defaultWaitRequestEngine } from "./wait-request-engine.js";
import { WaitRequestValidator, defaultWaitRequestValidator } from "./wait-request-rules.js";
import { WaitRequestStore } from "./wait-request-store.js";

/** Moves wait requests through their life cycle and keeps a journal of what it did. */
export class WaitRequestCoordinator {
  store: WaitRequestStore;
  validator: WaitRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitRequestEngine;

  constructor(
    store: WaitRequestStore,
    validator: WaitRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitRequestEngine,
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
      throw new Error(`wait request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWaitRequestCoordinator(store: WaitRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): WaitRequestCoordinator {
  return new WaitRequestCoordinator(
    store,
    defaultWaitRequestValidator(),
    clockValue,
    [],
    defaultWaitRequestEngine(flagsValue),
  );
}
