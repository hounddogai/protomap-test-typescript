import * as text from "../../../../kit/text.js";

/** Where a lenient subscription preference is in its life cycle. */
export type LenientSubscriptionPreferenceStatus = "created" | "validated" | "published" | "retired";

/** The record of a lenient subscription preference and its current status. */
export class LenientSubscriptionPreference {
  code: string;
  title: string;
  revision: number;
  approved: boolean;
  frequencyCap: number;
  status: LenientSubscriptionPreferenceStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    approved: boolean,
    frequencyCap: number,
    status: LenientSubscriptionPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.approved = approved;
    this.frequencyCap = frequencyCap;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientSubscriptionPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientSubscriptionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient subscription preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"lenient subscription preference"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision - this.frequencyCap) * 100) / 100;
  }

  copy(): LenientSubscriptionPreference {
    return new LenientSubscriptionPreference(
      this.code,
      this.title,
      this.revision,
      this.approved,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient subscription preference in status created. */
export function newLenientSubscriptionPreference(code: string, title: string): LenientSubscriptionPreference {
  return new LenientSubscriptionPreference(code, title, 0, false, 0, "created");
}
