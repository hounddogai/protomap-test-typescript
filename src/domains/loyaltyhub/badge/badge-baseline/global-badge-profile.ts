import * as text from "../../../../kit/text.js";

/** Where a global badge profile is in its life cycle. */
export type GlobalBadgeProfileStatus = "created" | "validated" | "published" | "retired";

/** A global badge profile. Its code is unique within a tenant. */
export class GlobalBadgeProfile {
  code: string;
  name: string;
  locale: string;
  limit: number;
  budget: number;
  tags: string[];
  audienceId: string;
  approved: boolean;
  status: GlobalBadgeProfileStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    limit: number,
    budget: number,
    tags: string[],
    audienceId: string,
    approved: boolean,
    status: GlobalBadgeProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.limit = limit;
    this.budget = budget;
    this.tags = tags;
    this.audienceId = audienceId;
    this.approved = approved;
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

  canMoveTo(next: GlobalBadgeProfileStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: GlobalBadgeProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global badge profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.budget * this.limit * 100) / 100;
  }

  copy(): GlobalBadgeProfile {
    return new GlobalBadgeProfile(
      this.code,
      this.name,
      this.locale,
      this.limit,
      this.budget,
      this.tags,
      this.audienceId,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a global badge profile in status created. */
export function newGlobalBadgeProfile(code: string, name: string): GlobalBadgeProfile {
  return new GlobalBadgeProfile(code, name, "", 0, 0, [], "", false, "created");
}
