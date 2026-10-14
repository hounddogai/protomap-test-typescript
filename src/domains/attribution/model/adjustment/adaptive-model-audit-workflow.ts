import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveModelAuditEngine, defaultAdaptiveModelAuditEngine } from "./adaptive-model-audit-engine.js";
import { AdaptiveModelAuditValidator, defaultAdaptiveModelAuditValidator } from "./adaptive-model-audit-rules.js";
import { AdaptiveModelAuditStore } from "./adaptive-model-audit-store.js";

/** Moves adaptive model audits through their life cycle and keeps a journal of what it did. */
export class AdaptiveModelAuditWorkflow {
  store: AdaptiveModelAuditStore;
  validator: AdaptiveModelAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveModelAuditEngine;

  constructor(
    store: AdaptiveModelAuditStore,
    validator: AdaptiveModelAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveModelAuditEngine,
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
      throw new Error(`adaptive model audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive model audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive model audit ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newAdaptiveModelAuditWorkflow(store: AdaptiveModelAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveModelAuditWorkflow {
  return new AdaptiveModelAuditWorkflow(
    store,
    defaultAdaptiveModelAuditValidator(),
    clockValue,
    [],
    defaultAdaptiveModelAuditEngine(flagsValue),
  );
}
