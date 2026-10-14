import * as clock from "../../../../kit/clock.js";
import {
  LegacySubscriptionSlotEngine,
  defaultLegacySubscriptionSlotEngine,
} from "./legacy-subscription-slot-engine.js";
import {
  LegacySubscriptionSlotValidator,
  defaultLegacySubscriptionSlotValidator,
} from "./legacy-subscription-slot-rules.js";
import { LegacySubscriptionSlotStore } from "./legacy-subscription-slot-store.js";

/** Moves legacy subscription slots through their life cycle and keeps a journal of what it did. */
export class LegacySubscriptionSlotService {
  store: LegacySubscriptionSlotStore;
  validator: LegacySubscriptionSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacySubscriptionSlotEngine;

  constructor(
    store: LegacySubscriptionSlotStore,
    validator: LegacySubscriptionSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacySubscriptionSlotEngine,
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
      throw new Error(`legacy subscription slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacySubscriptionSlotService(store: LegacySubscriptionSlotStore, clockValue: clock.Clock): LegacySubscriptionSlotService {
  return new LegacySubscriptionSlotService(
    store,
    defaultLegacySubscriptionSlotValidator(),
    clockValue,
    [],
    defaultLegacySubscriptionSlotEngine(),
  );
}
