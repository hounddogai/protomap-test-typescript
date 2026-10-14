import * as clock from "../../../../kit/clock.js";
import { TouchpointRequestEngine, defaultTouchpointRequestEngine } from "./touchpoint-request-engine.js";
import { TouchpointRequestValidator, defaultTouchpointRequestValidator } from "./touchpoint-request-rules.js";
import { TouchpointRequestStore } from "./touchpoint-request-store.js";

/** Moves touchpoint requests through their life cycle and keeps a journal of what it did. */
export class TouchpointRequestManager {
  store: TouchpointRequestStore;
  validator: TouchpointRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointRequestEngine;

  constructor(
    store: TouchpointRequestStore,
    validator: TouchpointRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointRequestEngine,
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
      throw new Error(`touchpoint request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint request ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTouchpointRequestManager(store: TouchpointRequestStore, clockValue: clock.Clock): TouchpointRequestManager {
  return new TouchpointRequestManager(
    store,
    defaultTouchpointRequestValidator(),
    clockValue,
    [],
    defaultTouchpointRequestEngine(),
  );
}
