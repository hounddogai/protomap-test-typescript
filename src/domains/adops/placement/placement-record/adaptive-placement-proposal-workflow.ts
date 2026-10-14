import * as clock from "../../../../kit/clock.js";
import {
  AdaptivePlacementProposalEngine,
  defaultAdaptivePlacementProposalEngine,
} from "./adaptive-placement-proposal-engine.js";
import {
  AdaptivePlacementProposalValidator,
  defaultAdaptivePlacementProposalValidator,
} from "./adaptive-placement-proposal-rules.js";
import { AdaptivePlacementProposalStore } from "./adaptive-placement-proposal-store.js";

/** Moves adaptive placement proposals through their life cycle and keeps a journal of what it did. */
export class AdaptivePlacementProposalCoordinator {
  store: AdaptivePlacementProposalStore;
  validator: AdaptivePlacementProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePlacementProposalEngine;

  constructor(
    store: AdaptivePlacementProposalStore,
    validator: AdaptivePlacementProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePlacementProposalEngine,
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
      throw new Error(`adaptive placement proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive placement proposal ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newAdaptivePlacementProposalCoordinator(store: AdaptivePlacementProposalStore, clockValue: clock.Clock): AdaptivePlacementProposalCoordinator {
  return new AdaptivePlacementProposalCoordinator(
    store,
    defaultAdaptivePlacementProposalValidator(),
    clockValue,
    [],
    defaultAdaptivePlacementProposalEngine(),
  );
}
