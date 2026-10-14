import * as clock from "../../../../kit/clock.js";
import {
  TieredFlightExceptionValidator,
  defaultTieredFlightExceptionValidator,
} from "./tiered-flight-exception-rules.js";
import { TieredFlightExceptionStore } from "./tiered-flight-exception-store.js";

/** Moves tiered flight exceptions through their life cycle and keeps a journal of what it did. */
export class TieredFlightExceptionWorkflow {
  store: TieredFlightExceptionStore;
  validator: TieredFlightExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredFlightExceptionStore,
    validator: TieredFlightExceptionValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered flight exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered flight exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredFlightExceptionWorkflow(store: TieredFlightExceptionStore, clockValue: clock.Clock): TieredFlightExceptionWorkflow {
  return new TieredFlightExceptionWorkflow(store, defaultTieredFlightExceptionValidator(), clockValue, []);
}
