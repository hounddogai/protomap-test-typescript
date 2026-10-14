import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryDomainScheduleEngine, defaultPrimaryDomainScheduleEngine } from "./primary-domain-schedule-engine.js";
import {
  PrimaryDomainScheduleValidator,
  defaultPrimaryDomainScheduleValidator,
} from "./primary-domain-schedule-rules.js";
import { PrimaryDomainScheduleStore } from "./primary-domain-schedule-store.js";

/** Moves primary domain schedules through their life cycle and keeps a journal of what it did. */
export class PrimaryDomainScheduleService {
  store: PrimaryDomainScheduleStore;
  validator: PrimaryDomainScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryDomainScheduleEngine;

  constructor(
    store: PrimaryDomainScheduleStore,
    validator: PrimaryDomainScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryDomainScheduleEngine,
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
      throw new Error(`primary domain schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary domain schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary domain schedule ${code} not found`);
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

export function newPrimaryDomainScheduleService(store: PrimaryDomainScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryDomainScheduleService {
  return new PrimaryDomainScheduleService(
    store,
    defaultPrimaryDomainScheduleValidator(),
    clockValue,
    [],
    defaultPrimaryDomainScheduleEngine(flagsValue),
  );
}
