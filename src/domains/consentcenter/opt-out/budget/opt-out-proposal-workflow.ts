import * as clock from "../../../../kit/clock.js";
import { OptOutProposalEngine, defaultOptOutProposalEngine } from "./opt-out-proposal-engine.js";
import { OptOutProposalValidator, defaultOptOutProposalValidator } from "./opt-out-proposal-rules.js";
import { OptOutProposalStore } from "./opt-out-proposal-store.js";

/** Moves opt out proposals through their life cycle and keeps a journal of what it did. */
export class OptOutProposalCoordinator {
  store: OptOutProposalStore;
  validator: OptOutProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutProposalEngine;

  constructor(
    store: OptOutProposalStore,
    validator: OptOutProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutProposalEngine,
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
      throw new Error(`opt out proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out proposal ${code} not found`);
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
      throw new Error(`opt out proposal ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newOptOutProposalCoordinator(store: OptOutProposalStore, clockValue: clock.Clock): OptOutProposalCoordinator {
  return new OptOutProposalCoordinator(
    store,
    defaultOptOutProposalValidator(),
    clockValue,
    [],
    defaultOptOutProposalEngine(),
  );
}
