import * as text from "../../../../kit/text.js";

/** Where a fallback bounce profile is in its life cycle. */
export type FallbackBounceProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback bounce profile. Its code is unique within a tenant. */
export class FallbackBounceProfile {
  code: string;
  name: string;
  variant: string;
  graceDays: number;
  archived: boolean;
  status: FallbackBounceProfileStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    graceDays: number,
    archived: boolean,
    status: FallbackBounceProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.graceDays = graceDays;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBounceProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackBounceProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bounce profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback bounce profile"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): FallbackBounceProfile {
    return new FallbackBounceProfile(this.code, this.name, this.variant, this.graceDays, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback bounce profile in status open. */
export function newFallbackBounceProfile(code: string, name: string): FallbackBounceProfile {
  return new FallbackBounceProfile(code, name, "", 0, false, "open");
}
