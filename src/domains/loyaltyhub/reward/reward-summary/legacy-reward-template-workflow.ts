import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyRewardTemplateEngine, defaultLegacyRewardTemplateEngine } from "./legacy-reward-template-engine.js";
import {
  LegacyRewardTemplateValidator,
  defaultLegacyRewardTemplateValidator,
} from "./legacy-reward-template-rules.js";
import { LegacyRewardTemplateStore } from "./legacy-reward-template-store.js";

/** Moves legacy reward templates through their life cycle and keeps a journal of what it did. */
export class LegacyRewardTemplateDesk {
  store: LegacyRewardTemplateStore;
  validator: LegacyRewardTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyRewardTemplateEngine;

  constructor(
    store: LegacyRewardTemplateStore,
    validator: LegacyRewardTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyRewardTemplateEngine,
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
      throw new Error(`legacy reward template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy reward template ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLegacyRewardTemplateDesk(store: LegacyRewardTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyRewardTemplateDesk {
  return new LegacyRewardTemplateDesk(
    store,
    defaultLegacyRewardTemplateValidator(),
    clockValue,
    [],
    defaultLegacyRewardTemplateEngine(flagsValue),
  );
}
