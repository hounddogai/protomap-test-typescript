import * as clock from "../../../../kit/clock.js";
import {
  LeaderboardReservationValidator,
  defaultLeaderboardReservationValidator,
} from "./leaderboard-reservation-rules.js";
import { LeaderboardReservationStore } from "./leaderboard-reservation-store.js";

/** Moves leaderboard reservations through their life cycle and keeps a journal of what it did. */
export class LeaderboardReservationDesk {
  store: LeaderboardReservationStore;
  validator: LeaderboardReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LeaderboardReservationStore,
    validator: LeaderboardReservationValidator,
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
      throw new Error(`leaderboard reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`leaderboard reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLeaderboardReservationDesk(store: LeaderboardReservationStore, clockValue: clock.Clock): LeaderboardReservationDesk {
  return new LeaderboardReservationDesk(store, defaultLeaderboardReservationValidator(), clockValue, []);
}
