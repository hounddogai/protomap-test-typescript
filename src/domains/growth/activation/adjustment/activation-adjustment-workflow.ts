import * as clock from "../../../../kit/clock.js";
import { ActivationAdjustmentEngine, defaultActivationAdjustmentEngine } from "./activation-adjustment-engine.js";
import {
  ActivationAdjustmentValidator,
  defaultActivationAdjustmentValidator,
} from "./activation-adjustment-rules.js";
import { ActivationAdjustmentStore } from "./activation-adjustment-store.js";

/** Moves activation adjustments through their life cycle and keeps a journal of what it did. */
export class ActivationAdjustmentDesk {
  store: ActivationAdjustmentStore;
  validator: ActivationAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationAdjustmentEngine;

  constructor(
    store: ActivationAdjustmentStore,
    validator: ActivationAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationAdjustmentEngine,
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
      throw new Error(`activation adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation adjustment ${code} not found`);
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
      throw new Error(`activation adjustment ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newActivationAdjustmentDesk(store: ActivationAdjustmentStore, clockValue: clock.Clock): ActivationAdjustmentDesk {
  return new ActivationAdjustmentDesk(
    store,
    defaultActivationAdjustmentValidator(),
    clockValue,
    [],
    defaultActivationAdjustmentEngine(),
  );
}
