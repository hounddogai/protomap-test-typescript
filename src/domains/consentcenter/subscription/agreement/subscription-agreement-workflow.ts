import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionAgreementEngine, defaultSubscriptionAgreementEngine } from "./subscription-agreement-engine.js";
import {
  SubscriptionAgreementValidator,
  defaultSubscriptionAgreementValidator,
} from "./subscription-agreement-rules.js";
import { SubscriptionAgreementStore } from "./subscription-agreement-store.js";

/** Moves subscription agreements through their life cycle and keeps a journal of what it did. */
export class SubscriptionAgreementWorkflow {
  store: SubscriptionAgreementStore;
  validator: SubscriptionAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionAgreementEngine;

  constructor(
    store: SubscriptionAgreementStore,
    validator: SubscriptionAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionAgreementEngine,
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
      throw new Error(`subscription agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription agreement ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newSubscriptionAgreementWorkflow(store: SubscriptionAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionAgreementWorkflow {
  return new SubscriptionAgreementWorkflow(
    store,
    defaultSubscriptionAgreementValidator(),
    clockValue,
    [],
    defaultSubscriptionAgreementEngine(flagsValue),
  );
}
