import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackInvitePreferenceEngine,
  defaultFallbackInvitePreferenceEngine,
} from "./fallback-invite-preference-engine.js";
import {
  FallbackInvitePreferenceValidator,
  defaultFallbackInvitePreferenceValidator,
} from "./fallback-invite-preference-rules.js";
import { FallbackInvitePreferenceStore } from "./fallback-invite-preference-store.js";

/** Moves fallback invite preferences through their life cycle and keeps a journal of what it did. */
export class FallbackInvitePreferenceService {
  store: FallbackInvitePreferenceStore;
  validator: FallbackInvitePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackInvitePreferenceEngine;

  constructor(
    store: FallbackInvitePreferenceStore,
    validator: FallbackInvitePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackInvitePreferenceEngine,
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
      throw new Error(`fallback invite preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback invite preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback invite preference ${code} not found`);
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

export function newFallbackInvitePreferenceService(store: FallbackInvitePreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackInvitePreferenceService {
  return new FallbackInvitePreferenceService(
    store,
    defaultFallbackInvitePreferenceValidator(),
    clockValue,
    [],
    defaultFallbackInvitePreferenceEngine(flagsValue),
  );
}
