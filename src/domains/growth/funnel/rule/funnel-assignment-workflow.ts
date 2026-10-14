import * as clock from "../../../../kit/clock.js";
import { FunnelAssignmentEngine, defaultFunnelAssignmentEngine } from "./funnel-assignment-engine.js";
import { FunnelAssignmentValidator, defaultFunnelAssignmentValidator } from "./funnel-assignment-rules.js";
import { FunnelAssignmentStore } from "./funnel-assignment-store.js";

/** Moves funnel assignments through their life cycle and keeps a journal of what it did. */
export class FunnelAssignmentDesk {
  store: FunnelAssignmentStore;
  validator: FunnelAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelAssignmentEngine;

  constructor(
    store: FunnelAssignmentStore,
    validator: FunnelAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelAssignmentEngine,
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
      throw new Error(`funnel assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel assignment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newFunnelAssignmentDesk(store: FunnelAssignmentStore, clockValue: clock.Clock): FunnelAssignmentDesk {
  return new FunnelAssignmentDesk(
    store,
    defaultFunnelAssignmentValidator(),
    clockValue,
    [],
    defaultFunnelAssignmentEngine(),
  );
}
