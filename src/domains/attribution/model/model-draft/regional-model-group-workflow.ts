import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalModelGroupEngine, defaultRegionalModelGroupEngine } from "./regional-model-group-engine.js";
import { RegionalModelGroupValidator, defaultRegionalModelGroupValidator } from "./regional-model-group-rules.js";
import { RegionalModelGroupStore } from "./regional-model-group-store.js";

/** Moves regional model groups through their life cycle and keeps a journal of what it did. */
export class RegionalModelGroupService {
  store: RegionalModelGroupStore;
  validator: RegionalModelGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalModelGroupEngine;

  constructor(
    store: RegionalModelGroupStore,
    validator: RegionalModelGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalModelGroupEngine,
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
      throw new Error(`regional model group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional model group ${code} not found`);
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
      throw new Error(`regional model group ${code} not found`);
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

export function newRegionalModelGroupService(store: RegionalModelGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalModelGroupService {
  return new RegionalModelGroupService(
    store,
    defaultRegionalModelGroupValidator(),
    clockValue,
    [],
    defaultRegionalModelGroupEngine(flagsValue),
  );
}
