import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingRewardRequestEngine, defaultPendingRewardRequestEngine } from "./pending-reward-request-engine.js";
import {
  PendingRewardRequestValidator,
  defaultPendingRewardRequestValidator,
} from "./pending-reward-request-rules.js";
import { PendingRewardRequestStore } from "./pending-reward-request-store.js";

/** Moves pending reward requests through their life cycle and keeps a journal of what it did. */
export class PendingRewardRequestCoordinator {
  store: PendingRewardRequestStore;
  validator: PendingRewardRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingRewardRequestEngine;

  constructor(
    store: PendingRewardRequestStore,
    validator: PendingRewardRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingRewardRequestEngine,
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
      throw new Error(`pending reward request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending reward request ${code} not found`);
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
      throw new Error(`pending reward request ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPendingRewardRequestCoordinator(store: PendingRewardRequestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingRewardRequestCoordinator {
  return new PendingRewardRequestCoordinator(
    store,
    defaultPendingRewardRequestValidator(),
    clockValue,
    [],
    defaultPendingRewardRequestEngine(flagsValue),
  );
}
