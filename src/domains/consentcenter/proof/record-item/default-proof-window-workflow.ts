import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultProofWindowEngine, defaultDefaultProofWindowEngine } from "./default-proof-window-engine.js";
import { DefaultProofWindowValidator, defaultDefaultProofWindowValidator } from "./default-proof-window-rules.js";
import { DefaultProofWindowStore } from "./default-proof-window-store.js";

/** Moves default proof windows through their life cycle and keeps a journal of what it did. */
export class DefaultProofWindowCoordinator {
  store: DefaultProofWindowStore;
  validator: DefaultProofWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultProofWindowEngine;

  constructor(
    store: DefaultProofWindowStore,
    validator: DefaultProofWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultProofWindowEngine,
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
      throw new Error(`default proof window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default proof window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default proof window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultProofWindowCoordinator(store: DefaultProofWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultProofWindowCoordinator {
  return new DefaultProofWindowCoordinator(
    store,
    defaultDefaultProofWindowValidator(),
    clockValue,
    [],
    defaultDefaultProofWindowEngine(flagsValue),
  );
}
