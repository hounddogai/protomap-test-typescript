import * as clock from "../../../../kit/clock.js";
import { ActivationRequestEngine, defaultActivationRequestEngine } from "./activation-request-engine.js";
import { ActivationRequestValidator, defaultActivationRequestValidator } from "./activation-request-rules.js";
import { ActivationRequestStore } from "./activation-request-store.js";

/** Moves activation requests through their life cycle and keeps a journal of what it did. */
export class ActivationRequestDesk {
  store: ActivationRequestStore;
  validator: ActivationRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationRequestEngine;

  constructor(
    store: ActivationRequestStore,
    validator: ActivationRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationRequestEngine,
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
      throw new Error(`activation request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation request ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newActivationRequestDesk(store: ActivationRequestStore, clockValue: clock.Clock): ActivationRequestDesk {
  return new ActivationRequestDesk(
    store,
    defaultActivationRequestValidator(),
    clockValue,
    [],
    defaultActivationRequestEngine(),
  );
}
