import * as clock from "../../../../kit/clock.js";
import { DefaultFunnelRequestEngine, defaultDefaultFunnelRequestEngine } from "./default-funnel-request-engine.js";
import {
  DefaultFunnelRequestValidator,
  defaultDefaultFunnelRequestValidator,
} from "./default-funnel-request-rules.js";
import { DefaultFunnelRequestStore } from "./default-funnel-request-store.js";

/** Moves default funnel requests through their life cycle and keeps a journal of what it did. */
export class DefaultFunnelRequestService {
  store: DefaultFunnelRequestStore;
  validator: DefaultFunnelRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFunnelRequestEngine;

  constructor(
    store: DefaultFunnelRequestStore,
    validator: DefaultFunnelRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFunnelRequestEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default funnel request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default funnel request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default funnel request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultFunnelRequestService(store: DefaultFunnelRequestStore, clockValue: clock.Clock): DefaultFunnelRequestService {
  return new DefaultFunnelRequestService(
    store,
    defaultDefaultFunnelRequestValidator(),
    clockValue,
    [],
    defaultDefaultFunnelRequestEngine(),
  );
}
