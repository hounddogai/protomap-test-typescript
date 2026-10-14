import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryJourneyAuditEngine, defaultPrimaryJourneyAuditEngine } from "./primary-journey-audit-engine.js";
import { PrimaryJourneyAuditValidator, defaultPrimaryJourneyAuditValidator } from "./primary-journey-audit-rules.js";
import { PrimaryJourneyAuditStore } from "./primary-journey-audit-store.js";

/** Moves primary journey audits through their life cycle and keeps a journal of what it did. */
export class PrimaryJourneyAuditWorkflow {
  store: PrimaryJourneyAuditStore;
  validator: PrimaryJourneyAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryJourneyAuditEngine;

  constructor(
    store: PrimaryJourneyAuditStore,
    validator: PrimaryJourneyAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryJourneyAuditEngine,
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
      throw new Error(`primary journey audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary journey audit ${code} not found`);
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
      throw new Error(`primary journey audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPrimaryJourneyAuditWorkflow(store: PrimaryJourneyAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryJourneyAuditWorkflow {
  return new PrimaryJourneyAuditWorkflow(
    store,
    defaultPrimaryJourneyAuditValidator(),
    clockValue,
    [],
    defaultPrimaryJourneyAuditEngine(flagsValue),
  );
}
