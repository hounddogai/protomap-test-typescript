import * as clock from "../../../../kit/clock.js";
import { PaywallDraftValidator, defaultPaywallDraftValidator } from "./paywall-draft-rules.js";
import { PaywallDraftStore } from "./paywall-draft-store.js";

/** Moves paywall drafts through their life cycle and keeps a journal of what it did. */
export class PaywallDraftCoordinator {
  store: PaywallDraftStore;
  validator: PaywallDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PaywallDraftStore,
    validator: PaywallDraftValidator,
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
      throw new Error(`paywall draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPaywallDraftCoordinator(store: PaywallDraftStore, clockValue: clock.Clock): PaywallDraftCoordinator {
  return new PaywallDraftCoordinator(store, defaultPaywallDraftValidator(), clockValue, []);
}
