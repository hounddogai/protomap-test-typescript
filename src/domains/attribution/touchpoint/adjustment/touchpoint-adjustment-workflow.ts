import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TouchpointAdjustmentEngine, defaultTouchpointAdjustmentEngine } from "./touchpoint-adjustment-engine.js";
import {
  TouchpointAdjustmentValidator,
  defaultTouchpointAdjustmentValidator,
} from "./touchpoint-adjustment-rules.js";
import { TouchpointAdjustmentStore } from "./touchpoint-adjustment-store.js";

/** Moves touchpoint adjustments through their life cycle and keeps a journal of what it did. */
export class TouchpointAdjustmentDesk {
  store: TouchpointAdjustmentStore;
  validator: TouchpointAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointAdjustmentEngine;

  constructor(
    store: TouchpointAdjustmentStore,
    validator: TouchpointAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointAdjustmentEngine,
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
      throw new Error(`touchpoint adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint adjustment ${code} not found`);
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
      throw new Error(`touchpoint adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTouchpointAdjustmentDesk(store: TouchpointAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): TouchpointAdjustmentDesk {
  return new TouchpointAdjustmentDesk(
    store,
    defaultTouchpointAdjustmentValidator(),
    clockValue,
    [],
    defaultTouchpointAdjustmentEngine(flagsValue),
  );
}
