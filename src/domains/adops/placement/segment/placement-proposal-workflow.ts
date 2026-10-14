import * as clock from "../../../../kit/clock.js";
import { PlacementProposalEngine, defaultPlacementProposalEngine } from "./placement-proposal-engine.js";
import { PlacementProposalValidator, defaultPlacementProposalValidator } from "./placement-proposal-rules.js";
import { PlacementProposalStore } from "./placement-proposal-store.js";

/** Moves placement proposals through their life cycle and keeps a journal of what it did. */
export class PlacementProposalCoordinator {
  store: PlacementProposalStore;
  validator: PlacementProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementProposalEngine;

  constructor(
    store: PlacementProposalStore,
    validator: PlacementProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementProposalEngine,
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
      throw new Error(`placement proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPlacementProposalCoordinator(store: PlacementProposalStore, clockValue: clock.Clock): PlacementProposalCoordinator {
  return new PlacementProposalCoordinator(
    store,
    defaultPlacementProposalValidator(),
    clockValue,
    [],
    defaultPlacementProposalEngine(),
  );
}
