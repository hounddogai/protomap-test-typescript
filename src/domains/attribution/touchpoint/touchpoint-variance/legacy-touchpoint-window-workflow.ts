import * as clock from "../../../../kit/clock.js";
import {
  LegacyTouchpointWindowValidator,
  defaultLegacyTouchpointWindowValidator,
} from "./legacy-touchpoint-window-rules.js";
import { LegacyTouchpointWindowStore } from "./legacy-touchpoint-window-store.js";

/** Moves legacy touchpoint windows through their life cycle and keeps a journal of what it did. */
export class LegacyTouchpointWindowDesk {
  store: LegacyTouchpointWindowStore;
  validator: LegacyTouchpointWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyTouchpointWindowStore,
    validator: LegacyTouchpointWindowValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy touchpoint window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy touchpoint window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newLegacyTouchpointWindowDesk(store: LegacyTouchpointWindowStore, clockValue: clock.Clock): LegacyTouchpointWindowDesk {
  return new LegacyTouchpointWindowDesk(store, defaultLegacyTouchpointWindowValidator(), clockValue, []);
}
