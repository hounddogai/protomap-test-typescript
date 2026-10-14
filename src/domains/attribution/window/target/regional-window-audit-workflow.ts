import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalWindowAuditEngine, defaultRegionalWindowAuditEngine } from "./regional-window-audit-engine.js";
import { RegionalWindowAuditValidator, defaultRegionalWindowAuditValidator } from "./regional-window-audit-rules.js";
import { RegionalWindowAuditStore } from "./regional-window-audit-store.js";

/** Moves regional window audits through their life cycle and keeps a journal of what it did. */
export class RegionalWindowAuditService {
  store: RegionalWindowAuditStore;
  validator: RegionalWindowAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalWindowAuditEngine;

  constructor(
    store: RegionalWindowAuditStore,
    validator: RegionalWindowAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalWindowAuditEngine,
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
      throw new Error(`regional window audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional window audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional window audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRegionalWindowAuditService(store: RegionalWindowAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalWindowAuditService {
  return new RegionalWindowAuditService(
    store,
    defaultRegionalWindowAuditValidator(),
    clockValue,
    [],
    defaultRegionalWindowAuditEngine(flagsValue),
  );
}
