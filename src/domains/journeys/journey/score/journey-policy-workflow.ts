import * as clock from "../../../../kit/clock.js";
import { JourneyPolicyEngine, defaultJourneyPolicyEngine } from "./journey-policy-engine.js";
import { JourneyPolicyValidator, defaultJourneyPolicyValidator } from "./journey-policy-rules.js";
import { JourneyPolicyStore } from "./journey-policy-store.js";

/** Moves journey policies through their life cycle and keeps a journal of what it did. */
export class JourneyPolicyService {
  store: JourneyPolicyStore;
  validator: JourneyPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyPolicyEngine;

  constructor(
    store: JourneyPolicyStore,
    validator: JourneyPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyPolicyEngine,
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
      throw new Error(`journey policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey policy ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newJourneyPolicyService(store: JourneyPolicyStore, clockValue: clock.Clock): JourneyPolicyService {
  return new JourneyPolicyService(store, defaultJourneyPolicyValidator(), clockValue, [], defaultJourneyPolicyEngine());
}
