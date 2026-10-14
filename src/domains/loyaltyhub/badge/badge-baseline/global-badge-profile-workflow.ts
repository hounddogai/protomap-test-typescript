import * as clock from "../../../../kit/clock.js";
import { GlobalBadgeProfileEngine, defaultGlobalBadgeProfileEngine } from "./global-badge-profile-engine.js";
import { GlobalBadgeProfileValidator, defaultGlobalBadgeProfileValidator } from "./global-badge-profile-rules.js";
import { GlobalBadgeProfileStore } from "./global-badge-profile-store.js";

/** Moves global badge profiles through their life cycle and keeps a journal of what it did. */
export class GlobalBadgeProfileDesk {
  store: GlobalBadgeProfileStore;
  validator: GlobalBadgeProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalBadgeProfileEngine;

  constructor(
    store: GlobalBadgeProfileStore,
    validator: GlobalBadgeProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalBadgeProfileEngine,
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
      throw new Error(`global badge profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global badge profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global badge profile ${code} not found`);
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

export function newGlobalBadgeProfileDesk(store: GlobalBadgeProfileStore, clockValue: clock.Clock): GlobalBadgeProfileDesk {
  return new GlobalBadgeProfileDesk(
    store,
    defaultGlobalBadgeProfileValidator(),
    clockValue,
    [],
    defaultGlobalBadgeProfileEngine(),
  );
}
