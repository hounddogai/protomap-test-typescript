import * as clock from "../../../../kit/clock.js";
import {
  SeasonalBouncePreferenceValidator,
  defaultSeasonalBouncePreferenceValidator,
} from "./seasonal-bounce-preference-rules.js";
import { SeasonalBouncePreferenceStore } from "./seasonal-bounce-preference-store.js";

/** Moves seasonal bounce preferences through their life cycle and keeps a journal of what it did. */
export class SeasonalBouncePreferenceService {
  store: SeasonalBouncePreferenceStore;
  validator: SeasonalBouncePreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalBouncePreferenceStore,
    validator: SeasonalBouncePreferenceValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal bounce preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal bounce preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newSeasonalBouncePreferenceService(store: SeasonalBouncePreferenceStore, clockValue: clock.Clock): SeasonalBouncePreferenceService {
  return new SeasonalBouncePreferenceService(store, defaultSeasonalBouncePreferenceValidator(), clockValue, []);
}
