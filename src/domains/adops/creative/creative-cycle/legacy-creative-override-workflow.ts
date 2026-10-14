import * as clock from "../../../../kit/clock.js";
import {
  LegacyCreativeOverrideEngine,
  defaultLegacyCreativeOverrideEngine,
} from "./legacy-creative-override-engine.js";
import {
  LegacyCreativeOverrideValidator,
  defaultLegacyCreativeOverrideValidator,
} from "./legacy-creative-override-rules.js";
import { LegacyCreativeOverrideStore } from "./legacy-creative-override-store.js";

/** Moves legacy creative overrides through their life cycle and keeps a journal of what it did. */
export class LegacyCreativeOverrideCoordinator {
  store: LegacyCreativeOverrideStore;
  validator: LegacyCreativeOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyCreativeOverrideEngine;

  constructor(
    store: LegacyCreativeOverrideStore,
    validator: LegacyCreativeOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyCreativeOverrideEngine,
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
      throw new Error(`legacy creative override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy creative override ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newLegacyCreativeOverrideCoordinator(store: LegacyCreativeOverrideStore, clockValue: clock.Clock): LegacyCreativeOverrideCoordinator {
  return new LegacyCreativeOverrideCoordinator(
    store,
    defaultLegacyCreativeOverrideValidator(),
    clockValue,
    [],
    defaultLegacyCreativeOverrideEngine(),
  );
}
