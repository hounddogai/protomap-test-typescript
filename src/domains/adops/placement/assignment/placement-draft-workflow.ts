import * as clock from "../../../../kit/clock.js";
import { PlacementDraftEngine, defaultPlacementDraftEngine } from "./placement-draft-engine.js";
import { PlacementDraftValidator, defaultPlacementDraftValidator } from "./placement-draft-rules.js";
import { PlacementDraftStore } from "./placement-draft-store.js";

/** Moves placement drafts through their life cycle and keeps a journal of what it did. */
export class PlacementDraftDesk {
  store: PlacementDraftStore;
  validator: PlacementDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PlacementDraftEngine;

  constructor(
    store: PlacementDraftStore,
    validator: PlacementDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PlacementDraftEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`placement draft ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPlacementDraftDesk(store: PlacementDraftStore, clockValue: clock.Clock): PlacementDraftDesk {
  return new PlacementDraftDesk(store, defaultPlacementDraftValidator(), clockValue, [], defaultPlacementDraftEngine());
}
