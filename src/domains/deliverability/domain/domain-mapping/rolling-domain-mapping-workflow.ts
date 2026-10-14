import * as clock from "../../../../kit/clock.js";
import { RollingDomainMappingEngine, defaultRollingDomainMappingEngine } from "./rolling-domain-mapping-engine.js";
import {
  RollingDomainMappingValidator,
  defaultRollingDomainMappingValidator,
} from "./rolling-domain-mapping-rules.js";
import { RollingDomainMappingStore } from "./rolling-domain-mapping-store.js";

/** Moves rolling domain mappings through their life cycle and keeps a journal of what it did. */
export class RollingDomainMappingManager {
  store: RollingDomainMappingStore;
  validator: RollingDomainMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingDomainMappingEngine;

  constructor(
    store: RollingDomainMappingStore,
    validator: RollingDomainMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingDomainMappingEngine,
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
      throw new Error(`rolling domain mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling domain mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling domain mapping ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newRollingDomainMappingManager(store: RollingDomainMappingStore, clockValue: clock.Clock): RollingDomainMappingManager {
  return new RollingDomainMappingManager(
    store,
    defaultRollingDomainMappingValidator(),
    clockValue,
    [],
    defaultRollingDomainMappingEngine(),
  );
}
