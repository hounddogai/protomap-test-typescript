import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalEscalationRecordEngine,
  defaultSeasonalEscalationRecordEngine,
} from "./seasonal-escalation-record-engine.js";
import {
  SeasonalEscalationRecordValidator,
  defaultSeasonalEscalationRecordValidator,
} from "./seasonal-escalation-record-rules.js";
import { SeasonalEscalationRecordStore } from "./seasonal-escalation-record-store.js";

/** Moves seasonal escalation records through their life cycle and keeps a journal of what it did. */
export class SeasonalEscalationRecordCoordinator {
  store: SeasonalEscalationRecordStore;
  validator: SeasonalEscalationRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalEscalationRecordEngine;

  constructor(
    store: SeasonalEscalationRecordStore,
    validator: SeasonalEscalationRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalEscalationRecordEngine,
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
      throw new Error(`seasonal escalation record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal escalation record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal escalation record ${code} not found`);
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

export function newSeasonalEscalationRecordCoordinator(store: SeasonalEscalationRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalEscalationRecordCoordinator {
  return new SeasonalEscalationRecordCoordinator(
    store,
    defaultSeasonalEscalationRecordValidator(),
    clockValue,
    [],
    defaultSeasonalEscalationRecordEngine(flagsValue),
  );
}
