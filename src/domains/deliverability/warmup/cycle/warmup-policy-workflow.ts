import * as clock from "../../../../kit/clock.js";
import { WarmupPolicyEngine, defaultWarmupPolicyEngine } from "./warmup-policy-engine.js";
import { WarmupPolicyValidator, defaultWarmupPolicyValidator } from "./warmup-policy-rules.js";
import { WarmupPolicyStore } from "./warmup-policy-store.js";

/** Moves warmup policies through their life cycle and keeps a journal of what it did. */
export class WarmupPolicyService {
  store: WarmupPolicyStore;
  validator: WarmupPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupPolicyEngine;

  constructor(
    store: WarmupPolicyStore,
    validator: WarmupPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupPolicyEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup policy ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newWarmupPolicyService(store: WarmupPolicyStore, clockValue: clock.Clock): WarmupPolicyService {
  return new WarmupPolicyService(store, defaultWarmupPolicyValidator(), clockValue, [], defaultWarmupPolicyEngine());
}
