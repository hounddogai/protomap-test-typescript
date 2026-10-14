import * as clock from "../../../../kit/clock.js";
import { DefaultTouchpointPlanEngine, defaultDefaultTouchpointPlanEngine } from "./default-touchpoint-plan-engine.js";
import {
  DefaultTouchpointPlanValidator,
  defaultDefaultTouchpointPlanValidator,
} from "./default-touchpoint-plan-rules.js";
import { DefaultTouchpointPlanStore } from "./default-touchpoint-plan-store.js";

/** Moves default touchpoint plans through their life cycle and keeps a journal of what it did. */
export class DefaultTouchpointPlanManager {
  store: DefaultTouchpointPlanStore;
  validator: DefaultTouchpointPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultTouchpointPlanEngine;

  constructor(
    store: DefaultTouchpointPlanStore,
    validator: DefaultTouchpointPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultTouchpointPlanEngine,
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
      throw new Error(`default touchpoint plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default touchpoint plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default touchpoint plan ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDefaultTouchpointPlanManager(store: DefaultTouchpointPlanStore, clockValue: clock.Clock): DefaultTouchpointPlanManager {
  return new DefaultTouchpointPlanManager(
    store,
    defaultDefaultTouchpointPlanValidator(),
    clockValue,
    [],
    defaultDefaultTouchpointPlanEngine(),
  );
}
