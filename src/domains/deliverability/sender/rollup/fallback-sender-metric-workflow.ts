import * as clock from "../../../../kit/clock.js";
import {
  FallbackSenderMetricValidator,
  defaultFallbackSenderMetricValidator,
} from "./fallback-sender-metric-rules.js";
import { FallbackSenderMetricStore } from "./fallback-sender-metric-store.js";

/** Moves fallback sender metrics through their life cycle and keeps a journal of what it did. */
export class FallbackSenderMetricService {
  store: FallbackSenderMetricStore;
  validator: FallbackSenderMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackSenderMetricStore,
    validator: FallbackSenderMetricValidator,
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
      throw new Error(`fallback sender metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback sender metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newFallbackSenderMetricService(store: FallbackSenderMetricStore, clockValue: clock.Clock): FallbackSenderMetricService {
  return new FallbackSenderMetricService(store, defaultFallbackSenderMetricValidator(), clockValue, []);
}
