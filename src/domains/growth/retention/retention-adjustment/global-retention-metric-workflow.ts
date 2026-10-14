import * as clock from "../../../../kit/clock.js";
import {
  GlobalRetentionMetricValidator,
  defaultGlobalRetentionMetricValidator,
} from "./global-retention-metric-rules.js";
import { GlobalRetentionMetricStore } from "./global-retention-metric-store.js";

/** Moves global retention metrics through their life cycle and keeps a journal of what it did. */
export class GlobalRetentionMetricManager {
  store: GlobalRetentionMetricStore;
  validator: GlobalRetentionMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalRetentionMetricStore,
    validator: GlobalRetentionMetricValidator,
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
      throw new Error(`global retention metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global retention metric ${code} not found`);
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

export function newGlobalRetentionMetricManager(store: GlobalRetentionMetricStore, clockValue: clock.Clock): GlobalRetentionMetricManager {
  return new GlobalRetentionMetricManager(store, defaultGlobalRetentionMetricValidator(), clockValue, []);
}
