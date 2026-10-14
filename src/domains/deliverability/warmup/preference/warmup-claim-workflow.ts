import * as clock from "../../../../kit/clock.js";
import { WarmupClaimValidator, defaultWarmupClaimValidator } from "./warmup-claim-rules.js";
import { WarmupClaimStore } from "./warmup-claim-store.js";

/** Moves warmup claims through their life cycle and keeps a journal of what it did. */
export class WarmupClaimManager {
  store: WarmupClaimStore;
  validator: WarmupClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WarmupClaimStore,
    validator: WarmupClaimValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newWarmupClaimManager(store: WarmupClaimStore, clockValue: clock.Clock): WarmupClaimManager {
  return new WarmupClaimManager(store, defaultWarmupClaimValidator(), clockValue, []);
}
