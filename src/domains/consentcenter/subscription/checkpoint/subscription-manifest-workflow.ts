import * as clock from "../../../../kit/clock.js";
import {
  SubscriptionManifestValidator,
  defaultSubscriptionManifestValidator,
} from "./subscription-manifest-rules.js";
import { SubscriptionManifestStore } from "./subscription-manifest-store.js";

/** Moves subscription manifests through their life cycle and keeps a journal of what it did. */
export class SubscriptionManifestService {
  store: SubscriptionManifestStore;
  validator: SubscriptionManifestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SubscriptionManifestStore,
    validator: SubscriptionManifestValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription manifest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription manifest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newSubscriptionManifestService(store: SubscriptionManifestStore, clockValue: clock.Clock): SubscriptionManifestService {
  return new SubscriptionManifestService(store, defaultSubscriptionManifestValidator(), clockValue, []);
}
