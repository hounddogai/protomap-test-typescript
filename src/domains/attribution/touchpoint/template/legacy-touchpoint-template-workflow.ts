import * as clock from "../../../../kit/clock.js";
import {
  LegacyTouchpointTemplateEngine,
  defaultLegacyTouchpointTemplateEngine,
} from "./legacy-touchpoint-template-engine.js";
import {
  LegacyTouchpointTemplateValidator,
  defaultLegacyTouchpointTemplateValidator,
} from "./legacy-touchpoint-template-rules.js";
import { LegacyTouchpointTemplateStore } from "./legacy-touchpoint-template-store.js";

/** Moves legacy touchpoint templates through their life cycle and keeps a journal of what it did. */
export class LegacyTouchpointTemplateManager {
  store: LegacyTouchpointTemplateStore;
  validator: LegacyTouchpointTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyTouchpointTemplateEngine;

  constructor(
    store: LegacyTouchpointTemplateStore,
    validator: LegacyTouchpointTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyTouchpointTemplateEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy touchpoint template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy touchpoint template ${code} not found`);
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
      throw new Error(`legacy touchpoint template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newLegacyTouchpointTemplateManager(store: LegacyTouchpointTemplateStore, clockValue: clock.Clock): LegacyTouchpointTemplateManager {
  return new LegacyTouchpointTemplateManager(
    store,
    defaultLegacyTouchpointTemplateValidator(),
    clockValue,
    [],
    defaultLegacyTouchpointTemplateEngine(),
  );
}
