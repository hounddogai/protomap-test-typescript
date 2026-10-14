import * as clock from "../../../../kit/clock.js";
import { FraudCheckScoreValidator, defaultFraudCheckScoreValidator } from "./fraud-check-score-rules.js";
import { FraudCheckScoreStore } from "./fraud-check-score-store.js";

/** Moves fraud check scores through their life cycle and keeps a journal of what it did. */
export class FraudCheckScoreManager {
  store: FraudCheckScoreStore;
  validator: FraudCheckScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckScoreStore,
    validator: FraudCheckScoreValidator,
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
      throw new Error(`fraud check score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newFraudCheckScoreManager(store: FraudCheckScoreStore, clockValue: clock.Clock): FraudCheckScoreManager {
  return new FraudCheckScoreManager(store, defaultFraudCheckScoreValidator(), clockValue, []);
}
