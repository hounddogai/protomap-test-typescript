import * as clock from "../../../../kit/clock.js";
import {
  ManualFraudCheckWindowEngine,
  defaultManualFraudCheckWindowEngine,
} from "./manual-fraud-check-window-engine.js";
import {
  ManualFraudCheckWindowValidator,
  defaultManualFraudCheckWindowValidator,
} from "./manual-fraud-check-window-rules.js";
import { ManualFraudCheckWindowStore } from "./manual-fraud-check-window-store.js";

/** Moves manual fraud check windows through their life cycle and keeps a journal of what it did. */
export class ManualFraudCheckWindowService {
  store: ManualFraudCheckWindowStore;
  validator: ManualFraudCheckWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFraudCheckWindowEngine;

  constructor(
    store: ManualFraudCheckWindowStore,
    validator: ManualFraudCheckWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFraudCheckWindowEngine,
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
      throw new Error(`manual fraud check window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual fraud check window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual fraud check window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newManualFraudCheckWindowService(store: ManualFraudCheckWindowStore, clockValue: clock.Clock): ManualFraudCheckWindowService {
  return new ManualFraudCheckWindowService(
    store,
    defaultManualFraudCheckWindowValidator(),
    clockValue,
    [],
    defaultManualFraudCheckWindowEngine(),
  );
}
