import * as clock from "../../../../kit/clock.js";
import { FunnelReservationEngine, defaultFunnelReservationEngine } from "./funnel-reservation-engine.js";
import { FunnelReservationValidator, defaultFunnelReservationValidator } from "./funnel-reservation-rules.js";
import { FunnelReservationStore } from "./funnel-reservation-store.js";

/** Moves funnel reservations through their life cycle and keeps a journal of what it did. */
export class FunnelReservationCoordinator {
  store: FunnelReservationStore;
  validator: FunnelReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelReservationEngine;

  constructor(
    store: FunnelReservationStore,
    validator: FunnelReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelReservationEngine,
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
      throw new Error(`funnel reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel reservation ${code} not found`);
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
      throw new Error(`funnel reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFunnelReservationCoordinator(store: FunnelReservationStore, clockValue: clock.Clock): FunnelReservationCoordinator {
  return new FunnelReservationCoordinator(
    store,
    defaultFunnelReservationValidator(),
    clockValue,
    [],
    defaultFunnelReservationEngine(),
  );
}
