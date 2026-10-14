import * as clock from "../../../../kit/clock.js";
import {
  RegionalChallengeAgreementValidator,
  defaultRegionalChallengeAgreementValidator,
} from "./regional-challenge-agreement-rules.js";
import { RegionalChallengeAgreementStore } from "./regional-challenge-agreement-store.js";

/** Moves regional challenge agreements through their life cycle and keeps a journal of what it did. */
export class RegionalChallengeAgreementDesk {
  store: RegionalChallengeAgreementStore;
  validator: RegionalChallengeAgreementValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalChallengeAgreementStore,
    validator: RegionalChallengeAgreementValidator,
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
      throw new Error(`regional challenge agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional challenge agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newRegionalChallengeAgreementDesk(store: RegionalChallengeAgreementStore, clockValue: clock.Clock): RegionalChallengeAgreementDesk {
  return new RegionalChallengeAgreementDesk(store, defaultRegionalChallengeAgreementValidator(), clockValue, []);
}
