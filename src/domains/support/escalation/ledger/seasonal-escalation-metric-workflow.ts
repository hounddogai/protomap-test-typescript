import * as clock from "../../../../kit/clock.js";
import {
  SeasonalEscalationMetricValidator,
  defaultSeasonalEscalationMetricValidator,
} from "./seasonal-escalation-metric-rules.js";
import { SeasonalEscalationMetricStore } from "./seasonal-escalation-metric-store.js";

/** Moves seasonal escalation metrics through their life cycle and keeps a journal of what it did. */
export class SeasonalEscalationMetricManager {
  store: SeasonalEscalationMetricStore;
  validator: SeasonalEscalationMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalEscalationMetricStore,
    validator: SeasonalEscalationMetricValidator,
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
      throw new Error(`seasonal escalation metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal escalation metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newSeasonalEscalationMetricManager(store: SeasonalEscalationMetricStore, clockValue: clock.Clock): SeasonalEscalationMetricManager {
  return new SeasonalEscalationMetricManager(store, defaultSeasonalEscalationMetricValidator(), clockValue, []);
}
