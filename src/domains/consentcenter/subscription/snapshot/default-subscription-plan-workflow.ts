import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultSubscriptionPlanEngine,
  defaultDefaultSubscriptionPlanEngine,
} from "./default-subscription-plan-engine.js";
import {
  DefaultSubscriptionPlanValidator,
  defaultDefaultSubscriptionPlanValidator,
} from "./default-subscription-plan-rules.js";
import { DefaultSubscriptionPlanStore } from "./default-subscription-plan-store.js";

/** Moves default subscription plans through their life cycle and keeps a journal of what it did. */
export class DefaultSubscriptionPlanDesk {
  store: DefaultSubscriptionPlanStore;
  validator: DefaultSubscriptionPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultSubscriptionPlanEngine;

  constructor(
    store: DefaultSubscriptionPlanStore,
    validator: DefaultSubscriptionPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultSubscriptionPlanEngine,
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
      throw new Error(`default subscription plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default subscription plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default subscription plan ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultSubscriptionPlanDesk(store: DefaultSubscriptionPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultSubscriptionPlanDesk {
  return new DefaultSubscriptionPlanDesk(
    store,
    defaultDefaultSubscriptionPlanValidator(),
    clockValue,
    [],
    defaultDefaultSubscriptionPlanEngine(flagsValue),
  );
}
