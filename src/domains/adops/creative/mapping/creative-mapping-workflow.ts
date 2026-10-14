import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeMappingEngine, defaultCreativeMappingEngine } from "./creative-mapping-engine.js";
import { CreativeMappingValidator, defaultCreativeMappingValidator } from "./creative-mapping-rules.js";
import { CreativeMappingStore } from "./creative-mapping-store.js";

/** Moves creative mappings through their life cycle and keeps a journal of what it did. */
export class CreativeMappingCoordinator {
  store: CreativeMappingStore;
  validator: CreativeMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeMappingEngine;

  constructor(
    store: CreativeMappingStore,
    validator: CreativeMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeMappingEngine,
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
      throw new Error(`creative mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative mapping ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCreativeMappingCoordinator(store: CreativeMappingStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeMappingCoordinator {
  return new CreativeMappingCoordinator(
    store,
    defaultCreativeMappingValidator(),
    clockValue,
    [],
    defaultCreativeMappingEngine(flagsValue),
  );
}
