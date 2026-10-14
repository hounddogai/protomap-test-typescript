import * as clock from "../../../../kit/clock.js";
import { LegacyDeflectionClaimEngine, defaultLegacyDeflectionClaimEngine } from "./legacy-deflection-claim-engine.js";
import {
  LegacyDeflectionClaimValidator,
  defaultLegacyDeflectionClaimValidator,
} from "./legacy-deflection-claim-rules.js";
import { LegacyDeflectionClaimStore } from "./legacy-deflection-claim-store.js";

/** Moves legacy deflection claims through their life cycle and keeps a journal of what it did. */
export class LegacyDeflectionClaimDesk {
  store: LegacyDeflectionClaimStore;
  validator: LegacyDeflectionClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyDeflectionClaimEngine;

  constructor(
    store: LegacyDeflectionClaimStore,
    validator: LegacyDeflectionClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyDeflectionClaimEngine,
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
      throw new Error(`legacy deflection claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy deflection claim ${code} not found`);
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

export function newLegacyDeflectionClaimDesk(store: LegacyDeflectionClaimStore, clockValue: clock.Clock): LegacyDeflectionClaimDesk {
  return new LegacyDeflectionClaimDesk(
    store,
    defaultLegacyDeflectionClaimValidator(),
    clockValue,
    [],
    defaultLegacyDeflectionClaimEngine(),
  );
}
