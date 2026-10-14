import * as clock from "../../../../kit/clock.js";
import { InsightPreferenceValidator, defaultInsightPreferenceValidator } from "./insight-preference-rules.js";
import { InsightPreferenceStore } from "./insight-preference-store.js";

/** Moves insight preferences through their life cycle and keeps a journal of what it did. */
export class InsightPreferenceService {
  store: InsightPreferenceStore;
  validator: InsightPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: InsightPreferenceStore,
    validator: InsightPreferenceValidator,
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
      throw new Error(`insight preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight preference ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInsightPreferenceService(store: InsightPreferenceStore, clockValue: clock.Clock): InsightPreferenceService {
  return new InsightPreferenceService(store, defaultInsightPreferenceValidator(), clockValue, []);
}
