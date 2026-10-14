import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeTierEngine, defaultCreativeTierEngine } from "./creative-tier-engine.js";
import { CreativeTierValidator, defaultCreativeTierValidator } from "./creative-tier-rules.js";
import { CreativeTierStore } from "./creative-tier-store.js";

/** Moves creative tiers through their life cycle and keeps a journal of what it did. */
export class CreativeTierManager {
  store: CreativeTierStore;
  validator: CreativeTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeTierEngine;

  constructor(
    store: CreativeTierStore,
    validator: CreativeTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeTierEngine,
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
      throw new Error(`creative tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative tier ${code} not found`);
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
      throw new Error(`creative tier ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newCreativeTierManager(store: CreativeTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeTierManager {
  return new CreativeTierManager(
    store,
    defaultCreativeTierValidator(),
    clockValue,
    [],
    defaultCreativeTierEngine(flagsValue),
  );
}
