import * as text from "../../../../kit/text.js";

/** Where a post budget is in its life cycle. */
export type PostBudgetStatus = "requested" | "granted" | "revoked" | "expired";

/** A post budget as the post team keeps it. */
export class PostBudget {
  code: string;
  title: string;
  updatedAt: number;
  category: string;
  expiresAt: number;
  unit: string;
  startsAt: number;
  margin: number;
  name: string;
  revision: number;
  status: PostBudgetStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    category: string,
    expiresAt: number,
    unit: string,
    startsAt: number,
    margin: number,
    name: string,
    revision: number,
    status: PostBudgetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.category = category;
    this.expiresAt = expiresAt;
    this.unit = unit;
    this.startsAt = startsAt;
    this.margin = margin;
    this.name = name;
    this.revision = revision;
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

  canMoveTo(next: PostBudgetStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.startsAt * this.updatedAt * 100) / 100;
  }

  copy(): PostBudget {
    return new PostBudget(
      this.code,
      this.title,
      this.updatedAt,
      this.category,
      this.expiresAt,
      this.unit,
      this.startsAt,
      this.margin,
      this.name,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a post budget in status requested. */
export function newPostBudget(code: string, title: string): PostBudget {
  return new PostBudget(code, title, 0, "", 0, "", 0, 0, "", 0, "requested");
}
