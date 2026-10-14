import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultDeflectionDigestEngine,
  defaultDefaultDeflectionDigestEngine,
} from "./default-deflection-digest-engine.js";
import {
  DefaultDeflectionDigestValidator,
  defaultDefaultDeflectionDigestValidator,
} from "./default-deflection-digest-rules.js";
import { DefaultDeflectionDigestStore } from "./default-deflection-digest-store.js";

/** Moves default deflection digests through their life cycle and keeps a journal of what it did. */
export class DefaultDeflectionDigestDesk {
  store: DefaultDeflectionDigestStore;
  validator: DefaultDeflectionDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultDeflectionDigestEngine;

  constructor(
    store: DefaultDeflectionDigestStore,
    validator: DefaultDeflectionDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultDeflectionDigestEngine,
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
      throw new Error(`default deflection digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default deflection digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default deflection digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newDefaultDeflectionDigestDesk(store: DefaultDeflectionDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultDeflectionDigestDesk {
  return new DefaultDeflectionDigestDesk(
    store,
    defaultDefaultDeflectionDigestValidator(),
    clockValue,
    [],
    defaultDefaultDeflectionDigestEngine(flagsValue),
  );
}
