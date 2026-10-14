import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveDeflectionTemplateEngine,
  defaultAdaptiveDeflectionTemplateEngine,
} from "./adaptive-deflection-template-engine.js";
import {
  AdaptiveDeflectionTemplateValidator,
  defaultAdaptiveDeflectionTemplateValidator,
} from "./adaptive-deflection-template-rules.js";
import { AdaptiveDeflectionTemplateStore } from "./adaptive-deflection-template-store.js";

/** Moves adaptive deflection templates through their life cycle and keeps a journal of what it did. */
export class AdaptiveDeflectionTemplateCoordinator {
  store: AdaptiveDeflectionTemplateStore;
  validator: AdaptiveDeflectionTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDeflectionTemplateEngine;

  constructor(
    store: AdaptiveDeflectionTemplateStore,
    validator: AdaptiveDeflectionTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDeflectionTemplateEngine,
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
      throw new Error(`adaptive deflection template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive deflection template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDeflectionTemplateCoordinator(store: AdaptiveDeflectionTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveDeflectionTemplateCoordinator {
  return new AdaptiveDeflectionTemplateCoordinator(
    store,
    defaultAdaptiveDeflectionTemplateValidator(),
    clockValue,
    [],
    defaultAdaptiveDeflectionTemplateEngine(flagsValue),
  );
}
