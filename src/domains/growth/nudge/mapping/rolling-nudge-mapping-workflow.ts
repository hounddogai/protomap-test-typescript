import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingNudgeMappingEngine, defaultRollingNudgeMappingEngine } from "./rolling-nudge-mapping-engine.js";
import { RollingNudgeMappingValidator, defaultRollingNudgeMappingValidator } from "./rolling-nudge-mapping-rules.js";
import { RollingNudgeMappingStore } from "./rolling-nudge-mapping-store.js";

/** Moves rolling nudge mappings through their life cycle and keeps a journal of what it did. */
export class RollingNudgeMappingDesk {
  store: RollingNudgeMappingStore;
  validator: RollingNudgeMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingNudgeMappingEngine;

  constructor(
    store: RollingNudgeMappingStore,
    validator: RollingNudgeMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingNudgeMappingEngine,
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
      throw new Error(`rolling nudge mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling nudge mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling nudge mapping ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRollingNudgeMappingDesk(store: RollingNudgeMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingNudgeMappingDesk {
  return new RollingNudgeMappingDesk(
    store,
    defaultRollingNudgeMappingValidator(),
    clockValue,
    [],
    defaultRollingNudgeMappingEngine(flagsValue),
  );
}
