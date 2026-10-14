import * as clock from "../../../../kit/clock.js";
import { SeasonalCsatPolicyValidator, defaultSeasonalCsatPolicyValidator } from "./seasonal-csat-policy-rules.js";
import { SeasonalCsatPolicyStore } from "./seasonal-csat-policy-store.js";

/** Moves seasonal csat policies through their life cycle and keeps a journal of what it did. */
export class SeasonalCsatPolicyWorkflow {
  store: SeasonalCsatPolicyStore;
  validator: SeasonalCsatPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalCsatPolicyStore,
    validator: SeasonalCsatPolicyValidator,
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
      throw new Error(`seasonal csat policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal csat policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalCsatPolicyWorkflow(store: SeasonalCsatPolicyStore, clockValue: clock.Clock): SeasonalCsatPolicyWorkflow {
  return new SeasonalCsatPolicyWorkflow(store, defaultSeasonalCsatPolicyValidator(), clockValue, []);
}
