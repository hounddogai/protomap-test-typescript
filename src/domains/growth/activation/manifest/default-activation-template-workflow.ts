import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultActivationTemplateEngine,
  defaultDefaultActivationTemplateEngine,
} from "./default-activation-template-engine.js";
import {
  DefaultActivationTemplateValidator,
  defaultDefaultActivationTemplateValidator,
} from "./default-activation-template-rules.js";
import { DefaultActivationTemplateStore } from "./default-activation-template-store.js";

/** Moves default activation templates through their life cycle and keeps a journal of what it did. */
export class DefaultActivationTemplateService {
  store: DefaultActivationTemplateStore;
  validator: DefaultActivationTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultActivationTemplateEngine;

  constructor(
    store: DefaultActivationTemplateStore,
    validator: DefaultActivationTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultActivationTemplateEngine,
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
      throw new Error(`default activation template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default activation template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default activation template ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultActivationTemplateService(store: DefaultActivationTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultActivationTemplateService {
  return new DefaultActivationTemplateService(
    store,
    defaultDefaultActivationTemplateValidator(),
    clockValue,
    [],
    defaultDefaultActivationTemplateEngine(flagsValue),
  );
}
