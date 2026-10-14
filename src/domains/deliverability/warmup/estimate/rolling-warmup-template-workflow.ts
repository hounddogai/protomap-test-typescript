import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingWarmupTemplateEngine, defaultRollingWarmupTemplateEngine } from "./rolling-warmup-template-engine.js";
import {
  RollingWarmupTemplateValidator,
  defaultRollingWarmupTemplateValidator,
} from "./rolling-warmup-template-rules.js";
import { RollingWarmupTemplateStore } from "./rolling-warmup-template-store.js";

/** Moves rolling warmup templates through their life cycle and keeps a journal of what it did. */
export class RollingWarmupTemplateCoordinator {
  store: RollingWarmupTemplateStore;
  validator: RollingWarmupTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWarmupTemplateEngine;

  constructor(
    store: RollingWarmupTemplateStore,
    validator: RollingWarmupTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWarmupTemplateEngine,
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
      throw new Error(`rolling warmup template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling warmup template ${code} not found`);
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
      throw new Error(`rolling warmup template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRollingWarmupTemplateCoordinator(store: RollingWarmupTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingWarmupTemplateCoordinator {
  return new RollingWarmupTemplateCoordinator(
    store,
    defaultRollingWarmupTemplateValidator(),
    clockValue,
    [],
    defaultRollingWarmupTemplateEngine(flagsValue),
  );
}
