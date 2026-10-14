import * as clock from "../../../../kit/clock.js";
import { RewardReservationEngine, defaultRewardReservationEngine } from "./reward-reservation-engine.js";
import { RewardReservationValidator, defaultRewardReservationValidator } from "./reward-reservation-rules.js";
import { RewardReservationStore } from "./reward-reservation-store.js";

/** Moves reward reservations through their life cycle and keeps a journal of what it did. */
export class RewardReservationDesk {
  store: RewardReservationStore;
  validator: RewardReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardReservationEngine;

  constructor(
    store: RewardReservationStore,
    validator: RewardReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardReservationEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newRewardReservationDesk(store: RewardReservationStore, clockValue: clock.Clock): RewardReservationDesk {
  return new RewardReservationDesk(
    store,
    defaultRewardReservationValidator(),
    clockValue,
    [],
    defaultRewardReservationEngine(),
  );
}
