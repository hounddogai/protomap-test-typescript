import * as clock from "../../../../kit/clock.js";
import {
  StrictEscalationAdjustmentEngine,
  defaultStrictEscalationAdjustmentEngine,
} from "./strict-escalation-adjustment-engine.js";
import {
  StrictEscalationAdjustmentValidator,
  defaultStrictEscalationAdjustmentValidator,
} from "./strict-escalation-adjustment-rules.js";
import { StrictEscalationAdjustmentStore } from "./strict-escalation-adjustment-store.js";

/** Moves strict escalation adjustments through their life cycle and keeps a journal of what it did. */
export class StrictEscalationAdjustmentManager {
  store: StrictEscalationAdjustmentStore;
  validator: StrictEscalationAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictEscalationAdjustmentEngine;

  constructor(
    store: StrictEscalationAdjustmentStore,
    validator: StrictEscalationAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictEscalationAdjustmentEngine,
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
      throw new Error(`strict escalation adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict escalation adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict escalation adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newStrictEscalationAdjustmentManager(store: StrictEscalationAdjustmentStore, clockValue: clock.Clock): StrictEscalationAdjustmentManager {
  return new StrictEscalationAdjustmentManager(
    store,
    defaultStrictEscalationAdjustmentValidator(),
    clockValue,
    [],
    defaultStrictEscalationAdjustmentEngine(),
  );
}
