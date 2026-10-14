import * as clock from "../../../../kit/clock.js";
import {
  PrimaryBadgeBaselineValidator,
  defaultPrimaryBadgeBaselineValidator,
} from "./primary-badge-baseline-rules.js";
import { PrimaryBadgeBaselineStore } from "./primary-badge-baseline-store.js";

/** Moves primary badge baselines through their life cycle and keeps a journal of what it did. */
export class PrimaryBadgeBaselineCoordinator {
  store: PrimaryBadgeBaselineStore;
  validator: PrimaryBadgeBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryBadgeBaselineStore,
    validator: PrimaryBadgeBaselineValidator,
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
      throw new Error(`primary badge baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary badge baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newPrimaryBadgeBaselineCoordinator(store: PrimaryBadgeBaselineStore, clockValue: clock.Clock): PrimaryBadgeBaselineCoordinator {
  return new PrimaryBadgeBaselineCoordinator(store, defaultPrimaryBadgeBaselineValidator(), clockValue, []);
}
