import * as clock from "../../../../kit/clock.js";
import {
  RollingReputationRequestEngine,
  defaultRollingReputationRequestEngine,
} from "./rolling-reputation-request-engine.js";
import {
  RollingReputationRequestValidator,
  defaultRollingReputationRequestValidator,
} from "./rolling-reputation-request-rules.js";
import { RollingReputationRequestStore } from "./rolling-reputation-request-store.js";

/** Moves rolling reputation requests through their life cycle and keeps a journal of what it did. */
export class RollingReputationRequestCoordinator {
  store: RollingReputationRequestStore;
  validator: RollingReputationRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingReputationRequestEngine;

  constructor(
    store: RollingReputationRequestStore,
    validator: RollingReputationRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingReputationRequestEngine,
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
      throw new Error(`rolling reputation request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling reputation request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling reputation request ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRollingReputationRequestCoordinator(store: RollingReputationRequestStore, clockValue: clock.Clock): RollingReputationRequestCoordinator {
  return new RollingReputationRequestCoordinator(
    store,
    defaultRollingReputationRequestValidator(),
    clockValue,
    [],
    defaultRollingReputationRequestEngine(),
  );
}
