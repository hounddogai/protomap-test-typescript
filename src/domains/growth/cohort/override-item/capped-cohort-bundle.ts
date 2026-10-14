import * as text from "../../../../kit/text.js";

/** Where a capped cohort bundle is in its life cycle. */
export type CappedCohortBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One capped cohort bundle, with what the planners need to act on it. */
export class CappedCohortBundle {
  code: string;
  name: string;
  floorValue: number;
  contactEmail: string;
  weight: number;
  startsAt: number;
  variant: string;
  version: number;
  sendAt: number;
  archived: boolean;
  status: CappedCohortBundleStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    contactEmail: string,
    weight: number,
    startsAt: number,
    variant: string,
    version: number,
    sendAt: number,
    archived: boolean,
    status: CappedCohortBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.contactEmail = contactEmail;
    this.weight = weight;
    this.startsAt = startsAt;
    this.variant = variant;
    this.version = version;
    this.sendAt = sendAt;
    this.archived = archived;
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

  canMoveTo(next: CappedCohortBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCohortBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped cohort bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"capped cohort bundle"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.sendAt * this.startsAt * 100) / 100;
  }

  copy(): CappedCohortBundle {
    return new CappedCohortBundle(
      this.code,
      this.name,
      this.floorValue,
      this.contactEmail,
      this.weight,
      this.startsAt,
      this.variant,
      this.version,
      this.sendAt,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped cohort bundle in status proposed. */
export function newCappedCohortBundle(code: string, name: string): CappedCohortBundle {
  return new CappedCohortBundle(code, name, 0, "", 0, 0, "", 0, 0, false, "proposed");
}
