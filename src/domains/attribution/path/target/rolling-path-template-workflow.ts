import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingPathTemplateEngine, defaultRollingPathTemplateEngine } from "./rolling-path-template-engine.js";
import { RollingPathTemplateValidator, defaultRollingPathTemplateValidator } from "./rolling-path-template-rules.js";
import { RollingPathTemplateStore } from "./rolling-path-template-store.js";

/** Moves rolling path templates through their life cycle and keeps a journal of what it did. */
export class RollingPathTemplateService {
  store: RollingPathTemplateStore;
  validator: RollingPathTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPathTemplateEngine;

  constructor(
    store: RollingPathTemplateStore,
    validator: RollingPathTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPathTemplateEngine,
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
      throw new Error(`rolling path template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling path template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling path template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingPathTemplateService(store: RollingPathTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingPathTemplateService {
  return new RollingPathTemplateService(
    store,
    defaultRollingPathTemplateValidator(),
    clockValue,
    [],
    defaultRollingPathTemplateEngine(flagsValue),
  );
}
