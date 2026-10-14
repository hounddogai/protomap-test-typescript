import * as clock from "../../../../kit/clock.js";
import {
  LenientFunnelSegmentValidator,
  defaultLenientFunnelSegmentValidator,
} from "./lenient-funnel-segment-rules.js";
import { LenientFunnelSegmentStore } from "./lenient-funnel-segment-store.js";

/** Moves lenient funnel segments through their life cycle and keeps a journal of what it did. */
export class LenientFunnelSegmentService {
  store: LenientFunnelSegmentStore;
  validator: LenientFunnelSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientFunnelSegmentStore,
    validator: LenientFunnelSegmentValidator,
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
      throw new Error(`lenient funnel segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient funnel segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientFunnelSegmentService(store: LenientFunnelSegmentStore, clockValue: clock.Clock): LenientFunnelSegmentService {
  return new LenientFunnelSegmentService(store, defaultLenientFunnelSegmentValidator(), clockValue, []);
}
