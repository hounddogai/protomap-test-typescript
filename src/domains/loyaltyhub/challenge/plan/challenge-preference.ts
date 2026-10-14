import * as text from "../../../../kit/text.js";

/** Where a challenge preference is in its life cycle. */
export type ChallengePreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a challenge preference and its current status. */
export class ChallengePreference {
  code: string;
  name: string;
  active: boolean;
  locale: string;
  region: string;
  maximum: number;
  ceiling: number;
  status: ChallengePreferenceStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    locale: string,
    region: string,
    maximum: number,
    ceiling: number,
    status: ChallengePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.locale = locale;
    this.region = region;
    this.maximum = maximum;
    this.ceiling = ceiling;
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

  canMoveTo(next: ChallengePreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ChallengePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"challenge preference"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.maximum + this.ceiling) * 100) / 100;
  }

  copy(): ChallengePreference {
    return new ChallengePreference(
      this.code,
      this.name,
      this.active,
      this.locale,
      this.region,
      this.maximum,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a challenge preference in status draft. */
export function newChallengePreference(code: string, name: string): ChallengePreference {
  return new ChallengePreference(code, name, false, "", "", 0, 0, "draft");
}
