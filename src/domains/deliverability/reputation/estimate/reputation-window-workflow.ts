import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReputationWindowEngine, defaultReputationWindowEngine } from "./reputation-window-engine.js";
import { ReputationWindowValidator, defaultReputationWindowValidator } from "./reputation-window-rules.js";
import { ReputationWindowStore } from "./reputation-window-store.js";

/** Moves reputation windows through their life cycle and keeps a journal of what it did. */
export class ReputationWindowCoordinator {
  store: ReputationWindowStore;
  validator: ReputationWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationWindowEngine;

  constructor(
    store: ReputationWindowStore,
    validator: ReputationWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationWindowEngine,
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
      throw new Error(`reputation window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation window ${code} not found`);
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

export function newReputationWindowCoordinator(store: ReputationWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReputationWindowCoordinator {
  return new ReputationWindowCoordinator(
    store,
    defaultReputationWindowValidator(),
    clockValue,
    [],
    defaultReputationWindowEngine(flagsValue),
  );
}
