import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalDomainGroupEngine, defaultGlobalDomainGroupEngine } from "./global-domain-group-engine.js";
import { GlobalDomainGroupValidator, defaultGlobalDomainGroupValidator } from "./global-domain-group-rules.js";
import { GlobalDomainGroupStore } from "./global-domain-group-store.js";

/** Moves global domain groups through their life cycle and keeps a journal of what it did. */
export class GlobalDomainGroupWorkflow {
  store: GlobalDomainGroupStore;
  validator: GlobalDomainGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalDomainGroupEngine;

  constructor(
    store: GlobalDomainGroupStore,
    validator: GlobalDomainGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalDomainGroupEngine,
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
      throw new Error(`global domain group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global domain group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global domain group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newGlobalDomainGroupWorkflow(store: GlobalDomainGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalDomainGroupWorkflow {
  return new GlobalDomainGroupWorkflow(
    store,
    defaultGlobalDomainGroupValidator(),
    clockValue,
    [],
    defaultGlobalDomainGroupEngine(flagsValue),
  );
}
