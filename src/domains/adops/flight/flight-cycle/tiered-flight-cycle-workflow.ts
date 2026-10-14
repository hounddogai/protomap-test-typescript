import * as clock from "../../../../kit/clock.js";
import { TieredFlightCycleValidator, defaultTieredFlightCycleValidator } from "./tiered-flight-cycle-rules.js";
import { TieredFlightCycleStore } from "./tiered-flight-cycle-store.js";

/** Moves tiered flight cycles through their life cycle and keeps a journal of what it did. */
export class TieredFlightCycleService {
  store: TieredFlightCycleStore;
  validator: TieredFlightCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredFlightCycleStore,
    validator: TieredFlightCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered flight cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered flight cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredFlightCycleService(store: TieredFlightCycleStore, clockValue: clock.Clock): TieredFlightCycleService {
  return new TieredFlightCycleService(store, defaultTieredFlightCycleValidator(), clockValue, []);
}
