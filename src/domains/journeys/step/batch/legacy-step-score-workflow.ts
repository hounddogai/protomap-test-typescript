import * as clock from "../../../../kit/clock.js";
import { LegacyStepScoreValidator, defaultLegacyStepScoreValidator } from "./legacy-step-score-rules.js";
import { LegacyStepScoreStore } from "./legacy-step-score-store.js";

/** Moves legacy step scores through their life cycle and keeps a journal of what it did. */
export class LegacyStepScoreDesk {
  store: LegacyStepScoreStore;
  validator: LegacyStepScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyStepScoreStore,
    validator: LegacyStepScoreValidator,
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
      throw new Error(`legacy step score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy step score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newLegacyStepScoreDesk(store: LegacyStepScoreStore, clockValue: clock.Clock): LegacyStepScoreDesk {
  return new LegacyStepScoreDesk(store, defaultLegacyStepScoreValidator(), clockValue, []);
}
