import * as clock from "../../../../kit/clock.js";
import { SubscriptionScoreValidator, defaultSubscriptionScoreValidator } from "./subscription-score-rules.js";
import { SubscriptionScoreStore } from "./subscription-score-store.js";

/** Moves subscription scores through their life cycle and keeps a journal of what it did. */
export class SubscriptionScoreManager {
  store: SubscriptionScoreStore;
  validator: SubscriptionScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SubscriptionScoreStore,
    validator: SubscriptionScoreValidator,
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
      throw new Error(`subscription score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription score ${code} not found`);
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

export function newSubscriptionScoreManager(store: SubscriptionScoreStore, clockValue: clock.Clock): SubscriptionScoreManager {
  return new SubscriptionScoreManager(store, defaultSubscriptionScoreValidator(), clockValue, []);
}
