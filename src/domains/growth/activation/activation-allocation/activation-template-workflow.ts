import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ActivationTemplateEngine, defaultActivationTemplateEngine } from "./activation-template-engine.js";
import { ActivationTemplateValidator, defaultActivationTemplateValidator } from "./activation-template-rules.js";
import { ActivationTemplateStore } from "./activation-template-store.js";

/** Moves activation templates through their life cycle and keeps a journal of what it did. */
export class ActivationTemplateManager {
  store: ActivationTemplateStore;
  validator: ActivationTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationTemplateEngine;

  constructor(
    store: ActivationTemplateStore,
    validator: ActivationTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationTemplateEngine,
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
      throw new Error(`activation template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation template ${code} not found`);
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

export function newActivationTemplateManager(store: ActivationTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): ActivationTemplateManager {
  return new ActivationTemplateManager(
    store,
    defaultActivationTemplateValidator(),
    clockValue,
    [],
    defaultActivationTemplateEngine(flagsValue),
  );
}
