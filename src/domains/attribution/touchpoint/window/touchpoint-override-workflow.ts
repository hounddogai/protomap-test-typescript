import * as clock from "../../../../kit/clock.js";
import { TouchpointOverrideEngine, defaultTouchpointOverrideEngine } from "./touchpoint-override-engine.js";
import { TouchpointOverrideValidator, defaultTouchpointOverrideValidator } from "./touchpoint-override-rules.js";
import { TouchpointOverrideStore } from "./touchpoint-override-store.js";

/** Moves touchpoint overrides through their life cycle and keeps a journal of what it did. */
export class TouchpointOverrideService {
  store: TouchpointOverrideStore;
  validator: TouchpointOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointOverrideEngine;

  constructor(
    store: TouchpointOverrideStore,
    validator: TouchpointOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointOverrideEngine,
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
      throw new Error(`touchpoint override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint override ${code} not found`);
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
      throw new Error(`touchpoint override ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTouchpointOverrideService(store: TouchpointOverrideStore, clockValue: clock.Clock): TouchpointOverrideService {
  return new TouchpointOverrideService(
    store,
    defaultTouchpointOverrideValidator(),
    clockValue,
    [],
    defaultTouchpointOverrideEngine(),
  );
}
