import * as text from "../../../../kit/text.js";

/** Where a tiered reputation assignment is in its life cycle. */
export type TieredReputationAssignmentStatus = "requested" | "granted" | "revoked" | "expired";

/** One tiered reputation assignment, with what the planners need to act on it. */
export class TieredReputationAssignment {
  code: string;
  label: string;
  durationMinutes: number;
  startsAt: number;
  externalRef: string;
  endsAt: number;
  attributes: Map<string, string>;
  active: boolean;
  region: string;
  capacity: number;
  sendAt: number;
  status: TieredReputationAssignmentStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    startsAt: number,
    externalRef: string,
    endsAt: number,
    attributes: Map<string, string>,
    active: boolean,
    region: string,
    capacity: number,
    sendAt: number,
    status: TieredReputationAssignmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.startsAt = startsAt;
    this.externalRef = externalRef;
    this.endsAt = endsAt;
    this.attributes = attributes;
    this.active = active;
    this.region = region;
    this.capacity = capacity;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredReputationAssignmentStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredReputationAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reputation assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"tiered reputation assignment"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round((this.sendAt + this.capacity) * 100) / 100;
  }

  copy(): TieredReputationAssignment {
    return new TieredReputationAssignment(
      this.code,
      this.label,
      this.durationMinutes,
      this.startsAt,
      this.externalRef,
      this.endsAt,
      this.attributes,
      this.active,
      this.region,
      this.capacity,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tiered reputation assignment in status requested. */
export function newTieredReputationAssignment(code: string, label: string): TieredReputationAssignment {
  return new TieredReputationAssignment(
    code,
    label,
    0,
    0,
    "",
    0,
    new Map<string, string>(),
    false,
    "",
    0,
    0,
    "requested",
  );
}
