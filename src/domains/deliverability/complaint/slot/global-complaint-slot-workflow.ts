import * as clock from "../../../../kit/clock.js";
import { GlobalComplaintSlotEngine, defaultGlobalComplaintSlotEngine } from "./global-complaint-slot-engine.js";
import { GlobalComplaintSlotValidator, defaultGlobalComplaintSlotValidator } from "./global-complaint-slot-rules.js";
import { GlobalComplaintSlotStore } from "./global-complaint-slot-store.js";

/** Moves global complaint slots through their life cycle and keeps a journal of what it did. */
export class GlobalComplaintSlotCoordinator {
  store: GlobalComplaintSlotStore;
  validator: GlobalComplaintSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalComplaintSlotEngine;

  constructor(
    store: GlobalComplaintSlotStore,
    validator: GlobalComplaintSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalComplaintSlotEngine,
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
      throw new Error(`global complaint slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global complaint slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global complaint slot ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newGlobalComplaintSlotCoordinator(store: GlobalComplaintSlotStore, clockValue: clock.Clock): GlobalComplaintSlotCoordinator {
  return new GlobalComplaintSlotCoordinator(
    store,
    defaultGlobalComplaintSlotValidator(),
    clockValue,
    [],
    defaultGlobalComplaintSlotEngine(),
  );
}
