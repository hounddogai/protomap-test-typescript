import * as clock from "../../../../kit/clock.js";
import { FunnelClaimValidator, defaultFunnelClaimValidator } from "./funnel-claim-rules.js";
import { FunnelClaimStore } from "./funnel-claim-store.js";

/** Moves funnel claims through their life cycle and keeps a journal of what it did. */
export class FunnelClaimWorkflow {
  store: FunnelClaimStore;
  validator: FunnelClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FunnelClaimStore,
    validator: FunnelClaimValidator,
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
      throw new Error(`funnel claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newFunnelClaimWorkflow(store: FunnelClaimStore, clockValue: clock.Clock): FunnelClaimWorkflow {
  return new FunnelClaimWorkflow(store, defaultFunnelClaimValidator(), clockValue, []);
}
