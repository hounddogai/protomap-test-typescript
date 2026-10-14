import * as clock from "../../../../kit/clock.js";
import { GlobalTierDigestValidator, defaultGlobalTierDigestValidator } from "./global-tier-digest-rules.js";
import { GlobalTierDigestStore } from "./global-tier-digest-store.js";

/** Moves global tier digests through their life cycle and keeps a journal of what it did. */
export class GlobalTierDigestWorkflow {
  store: GlobalTierDigestStore;
  validator: GlobalTierDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalTierDigestStore,
    validator: GlobalTierDigestValidator,
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
      throw new Error(`global tier digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global tier digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newGlobalTierDigestWorkflow(store: GlobalTierDigestStore, clockValue: clock.Clock): GlobalTierDigestWorkflow {
  return new GlobalTierDigestWorkflow(store, defaultGlobalTierDigestValidator(), clockValue, []);
}
