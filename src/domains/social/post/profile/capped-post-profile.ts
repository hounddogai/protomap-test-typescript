/**
 * The capped post profile records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped post profile is in its life cycle. */
export type CappedPostProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One capped post profile, with what the planners need to act on it. */
export class CappedPostProfile {
  code: string;
  title: string;
  unit: string;
  segment: string;
  version: number;
  visible: boolean;
  phone: string;
  country: string;
  weight: number;
  status: CappedPostProfileStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    segment: string,
    version: number,
    visible: boolean,
    phone: string,
    country: string,
    weight: number,
    status: CappedPostProfileStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.segment = segment;
    this.version = version;
    this.visible = visible;
    this.phone = phone;
    this.country = country;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPostProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPostProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped post profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"capped post profile"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.version * this.weight * 100) / 100;
  }

  copy(): CappedPostProfile {
    return new CappedPostProfile(
      this.code,
      this.title,
      this.unit,
      this.segment,
      this.version,
      this.visible,
      this.phone,
      this.country,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped post profile in status draft. */
export function newCappedPostProfile(code: string, title: string): CappedPostProfile {
  return new CappedPostProfile(code, title, "", "", 0, false, "", "", 0, "draft");
}
