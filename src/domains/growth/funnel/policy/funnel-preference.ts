import * as text from "../../../../kit/text.js";

/** Where a funnel preference is in its life cycle. */
export type FunnelPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A funnel preference as the funnel team keeps it. */
export class FunnelPreference {
  code: string;
  name: string;
  ceiling: number;
  startsAt: number;
  rate: number;
  cost: number;
  revision: number;
  capacity: number;
  status: FunnelPreferenceStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    startsAt: number,
    rate: number,
    cost: number,
    revision: number,
    capacity: number,
    status: FunnelPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.rate = rate;
    this.cost = cost;
    this.revision = revision;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round((this.ceiling + this.capacity) * 100) / 100;
  }

  copy(): FunnelPreference {
    return new FunnelPreference(
      this.code,
      this.name,
      this.ceiling,
      this.startsAt,
      this.rate,
      this.cost,
      this.revision,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel preference in status proposed. */
export function newFunnelPreference(code: string, name: string): FunnelPreference {
  return new FunnelPreference(code, name, 0, 0, 0, 0, 0, 0, "proposed");
}
