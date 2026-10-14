import * as clock from "../../../../kit/clock.js";
import { FunnelRequestEngine, defaultFunnelRequestEngine } from "./funnel-request-engine.js";
import { FunnelRequestValidator, defaultFunnelRequestValidator } from "./funnel-request-rules.js";
import { FunnelRequestStore } from "./funnel-request-store.js";

/** Moves funnel requests through their life cycle and keeps a journal of what it did. */
export class FunnelRequestDesk {
  store: FunnelRequestStore;
  validator: FunnelRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelRequestEngine;

  constructor(
    store: FunnelRequestStore,
    validator: FunnelRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelRequestEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel request ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFunnelRequestDesk(store: FunnelRequestStore, clockValue: clock.Clock): FunnelRequestDesk {
  return new FunnelRequestDesk(store, defaultFunnelRequestValidator(), clockValue, [], defaultFunnelRequestEngine());
}
