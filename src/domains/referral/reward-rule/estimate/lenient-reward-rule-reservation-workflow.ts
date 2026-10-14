import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientRewardRuleReservationEngine,
  defaultLenientRewardRuleReservationEngine,
} from "./lenient-reward-rule-reservation-engine.js";
import {
  LenientRewardRuleReservationValidator,
  defaultLenientRewardRuleReservationValidator,
} from "./lenient-reward-rule-reservation-rules.js";
import { LenientRewardRuleReservationStore } from "./lenient-reward-rule-reservation-store.js";

/** Moves lenient reward rule reservations through their life cycle and keeps a journal of what it did. */
export class LenientRewardRuleReservationCoordinator {
  store: LenientRewardRuleReservationStore;
  validator: LenientRewardRuleReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientRewardRuleReservationEngine;

  constructor(
    store: LenientRewardRuleReservationStore,
    validator: LenientRewardRuleReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientRewardRuleReservationEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward rule reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward rule reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient reward rule reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLenientRewardRuleReservationCoordinator(store: LenientRewardRuleReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientRewardRuleReservationCoordinator {
  return new LenientRewardRuleReservationCoordinator(
    store,
    defaultLenientRewardRuleReservationValidator(),
    clockValue,
    [],
    defaultLenientRewardRuleReservationEngine(flagsValue),
  );
}
