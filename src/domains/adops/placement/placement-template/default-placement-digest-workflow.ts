import * as clock from "../../../../kit/clock.js";
import {
  DefaultPlacementDigestValidator,
  defaultDefaultPlacementDigestValidator,
} from "./default-placement-digest-rules.js";
import { DefaultPlacementDigestStore } from "./default-placement-digest-store.js";

/** Moves default placement digests through their life cycle and keeps a journal of what it did. */
export class DefaultPlacementDigestManager {
  store: DefaultPlacementDigestStore;
  validator: DefaultPlacementDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultPlacementDigestStore,
    validator: DefaultPlacementDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default placement digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newDefaultPlacementDigestManager(store: DefaultPlacementDigestStore, clockValue: clock.Clock): DefaultPlacementDigestManager {
  return new DefaultPlacementDigestManager(store, defaultDefaultPlacementDigestValidator(), clockValue, []);
}
