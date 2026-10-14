import * as clock from "../../../../kit/clock.js";
import { ComplaintSlotEngine, defaultComplaintSlotEngine } from "./complaint-slot-engine.js";
import { ComplaintSlotValidator, defaultComplaintSlotValidator } from "./complaint-slot-rules.js";
import { ComplaintSlotStore } from "./complaint-slot-store.js";

/** Moves complaint slots through their life cycle and keeps a journal of what it did. */
export class ComplaintSlotService {
  store: ComplaintSlotStore;
  validator: ComplaintSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintSlotEngine;

  constructor(
    store: ComplaintSlotStore,
    validator: ComplaintSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintSlotEngine,
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
      throw new Error(`complaint slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint slot ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newComplaintSlotService(store: ComplaintSlotStore, clockValue: clock.Clock): ComplaintSlotService {
  return new ComplaintSlotService(store, defaultComplaintSlotValidator(), clockValue, [], defaultComplaintSlotEngine());
}
