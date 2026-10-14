import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientWarmupTemplateEngine, defaultLenientWarmupTemplateEngine } from "./lenient-warmup-template-engine.js";
import {
  LenientWarmupTemplateValidator,
  defaultLenientWarmupTemplateValidator,
} from "./lenient-warmup-template-rules.js";
import { LenientWarmupTemplateStore } from "./lenient-warmup-template-store.js";

/** Moves lenient warmup templates through their life cycle and keeps a journal of what it did. */
export class LenientWarmupTemplateCoordinator {
  store: LenientWarmupTemplateStore;
  validator: LenientWarmupTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientWarmupTemplateEngine;

  constructor(
    store: LenientWarmupTemplateStore,
    validator: LenientWarmupTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientWarmupTemplateEngine,
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
      throw new Error(`lenient warmup template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup template ${code} not found`);
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

export function newLenientWarmupTemplateCoordinator(store: LenientWarmupTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientWarmupTemplateCoordinator {
  return new LenientWarmupTemplateCoordinator(
    store,
    defaultLenientWarmupTemplateValidator(),
    clockValue,
    [],
    defaultLenientWarmupTemplateEngine(flagsValue),
  );
}
