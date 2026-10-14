import * as clock from "../../../../kit/clock.js";
import {
  WeightedJourneyAgreementValidator,
  defaultWeightedJourneyAgreementValidator,
} from "./weighted-journey-agreement-rules.js";
import { WeightedJourneyAgreementStore } from "./weighted-journey-agreement-store.js";

/** Moves weighted journey agreements through their life cycle and keeps a journal of what it did. */
export class WeightedJourneyAgreementDesk {
  store: WeightedJourneyAgreementStore;
  validator: WeightedJourneyAgreementValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedJourneyAgreementStore,
    validator: WeightedJourneyAgreementValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted journey agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted journey agreement ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedJourneyAgreementDesk(store: WeightedJourneyAgreementStore, clockValue: clock.Clock): WeightedJourneyAgreementDesk {
  return new WeightedJourneyAgreementDesk(store, defaultWeightedJourneyAgreementValidator(), clockValue, []);
}
