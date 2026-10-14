import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyProofClaimEngine, defaultLegacyProofClaimEngine } from "./legacy-proof-claim-engine.js";
import { LegacyProofClaimValidator, defaultLegacyProofClaimValidator } from "./legacy-proof-claim-rules.js";
import { LegacyProofClaimStore } from "./legacy-proof-claim-store.js";

/** Moves legacy proof claims through their life cycle and keeps a journal of what it did. */
export class LegacyProofClaimDesk {
  store: LegacyProofClaimStore;
  validator: LegacyProofClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyProofClaimEngine;

  constructor(
    store: LegacyProofClaimStore,
    validator: LegacyProofClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyProofClaimEngine,
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
      throw new Error(`legacy proof claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy proof claim ${code} not found`);
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
      throw new Error(`legacy proof claim ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLegacyProofClaimDesk(store: LegacyProofClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyProofClaimDesk {
  return new LegacyProofClaimDesk(
    store,
    defaultLegacyProofClaimValidator(),
    clockValue,
    [],
    defaultLegacyProofClaimEngine(flagsValue),
  );
}
